/*==============================================================================
  LOCKING_HELPERS(PURE;NO ACTION/UI CALLS)—MODULE-AGNOSTIC

  STATE VARS(TYPE→DEFAULT)
    lockPromptMinutes:number          → 1
    lockLoopRunning:boolean           → false
    lockModule:string|null            → null
    lockRecordId:number|null          → null
    lockUserId:number|null            → null
    lockCountdownDeadline:number(ms)  → 0
    lockSecondsLeft:number            → 0
    lockCountdownModalShown:boolean   → false
    lockShouldOpenModal:boolean       → false
    lastHeartbeatAt:number(ms)        → 0
    lockHeartbeatPeriodMs:number(ms)  → 10000
    lockClockNowMs:number(ms)         → 0        //EXTERNALCLOCKTICK(SETBYINTERVAL)

  PUBLIC HELPERS
    lockingInstallDefaults()
    lockingStartFromPrompt(opts?)             //opts:{module?,recordId?,userId?,heartbeatPeriodMs?,promptMinutes?,nowMs?}
    lockingRearmDeadlineFromPrompt(nowMs?)
    lockingStop()
    lockingTickPlan(nowMs?)
    lockingApplyCountdown(secondsLeft)
    lockingMarkModalShown()
    lockingMarkHeartbeat(nowMs?)
    lockingGetContext()                       //{module,recordId,userId}
    lockingRaisePromptSignal()
    lockingClearPromptSignal()
    lockingSetClockNow(nowMs)                 //SETSSTATEVARlockClockNowMs
==============================================================================*/



const LOCKING_DEFAULTS =
    {
    lockPromptMinutes:1,
    lockLoopRunning:false,
    lockModule:null,
    lockRecordId:null,
    lockUserId:null,
    lockCountdownDeadline:0,
    lockSecondsLeft:0,
    lockCountdownModalShown:false,
    lockShouldOpenModal:false,
    lastHeartbeatAt:0,
    lockHeartbeatPeriodMs:10000,
    lockClockNowMs:0
    };

function _posNum(v,def,min)
    {
    const n=Number(v);
    if(!Number.isFinite(n)||n<=0){return def;}
    return Math.max(n,min);
    }

function _n(x,d=0)
    {
    const n=Number(x);
    return Number.isFinite(n)?n:d;
    }

function _clockNow()
    {
    //RETURNSCURRENTCLOCKFROMSTATE;CONTROLLEDBYINTERVAL,NOTSYSTEMCLOCK
    return _n(state.getValue('lockClockNowMs'),0);
    }

function fmtMmSs(totalSeconds)
    {
    const s=Math.max(0,Number(totalSeconds)||0);
    const mm=String(Math.floor(s/60)).padStart(2,'0');
    const ss=String(s%60).padStart(2,'0');
    return `${mm}:${ss}`;
    }

// STATELESS TICK HELPER(PURE)
function lockTick(nowMs,deadlineMs,lastHeartbeatAtMs,periodMs)
    {
    const nNow=_n(nowMs,NaN);
    const nDead=_n(deadlineMs,NaN);
    const nLast=_n(lastHeartbeatAtMs,NaN);
    const nPeriod=_n(periodMs,NaN);

    if(!Number.isFinite(nNow)){throw Error('LOCK_TICK_BAD_NOW');}
    if(!Number.isFinite(nDead)){throw Error('LOCK_TICK_BAD_DEADLINE');}
    if(!Number.isFinite(nLast)){throw Error('LOCK_TICK_BAD_LAST');}
    if(!Number.isFinite(nPeriod)||nPeriod<=0){throw Error('LOCK_TICK_BAD_PERIOD');}

    const msLeft=Math.max(0,nDead-nNow);
    const secondsLeft=Math.ceil(msLeft/1000);
    const shouldOpen=(secondsLeft<=0);
    const shouldBeat=((nNow-nLast)>=nPeriod);

    return {secondsLeft,shouldOpenModal:shouldOpen,shouldHeartbeat:shouldBeat,now:nNow};
    }

async function lockingInstallDefaults()
    {
    for(const [k,v] of Object.entries(LOCKING_DEFAULTS))
        {
        const cur=state.getValue(k);
        if(cur===undefined||cur===null)
            {await state.setValue(k,v);}
        }
    return true;
    }

function _msUntil(deadlineMs,nowMs)
    {
    return Math.max(0,_n(deadlineMs)-_n(nowMs,0));
    }

function _secondsLeft(deadlineMs,nowMs)
    {
    return Math.ceil(_msUntil(deadlineMs,nowMs)/1000);
    }

function _shouldRun(nowMs,lastRunMs,periodMs)
    {
    return (_n(nowMs)-_n(lastRunMs))>=_n(periodMs);
    }

function _readPromptMinutes()
    {return Math.max(0,_n(state.getValue('lockPromptMinutes'),1));}

function _deadlineFromPrompt(nowMs)
    {
    return _n(nowMs,0)+_readPromptMinutes()*60*1000;
    }

async function lockingRearmDeadlineFromPrompt(nowMs)
    {
    const clock=_n(nowMs,_clockNow());
    const dl=_deadlineFromPrompt(clock);
    await state.setValue('lockCountdownDeadline',dl);
    await state.setValue('lockCountdownModalShown',false);
    await state.setValue('lockShouldOpenModal',false);
    return dl;
    }

async function lockingStartFromPrompt(opts)
    {
    await lockingInstallDefaults();
    const o=opts||{};
    if('module'in o){await state.setValue('lockModule',o.module);}
    if('recordId'in o){await state.setValue('lockRecordId',_n(o.recordId,null));}
    if('userId'in o){await state.setValue('lockUserId',_n(o.userId,null));}
    if('heartbeatPeriodMs'in o){await state.setValue('lockHeartbeatPeriodMs',_n(o.heartbeatPeriodMs,10000));}
    if('promptMinutes'in o){await state.setValue('lockPromptMinutes',_n(o.promptMinutes,1));}
    await lockingRearmDeadlineFromPrompt(o.nowMs);
    await state.setValue('lockLoopRunning',true);
    return true;
    }

async function lockingStop()
    {
    await state.setValue('lockLoopRunning',false);
    return true;
    }

function lockingTickPlan(nowMs)
    {
    const now=_n(nowMs,_clockNow());
    const deadline=state.getValue('lockCountdownDeadline');

    const sLeft=_secondsLeft(deadline,now);
    const shouldOpen=(sLeft<=0)&&(state.getValue('lockCountdownModalShown')!==true);

    const running=(state.getValue('lockLoopRunning')===true);
    const period=_n(state.getValue('lockHeartbeatPeriodMs'),10000);
    const last=_n(state.getValue('lastHeartbeatAt'),0);
    const shouldHb=running&&_shouldRun(now,last,period);

    return {secondsLeft:sLeft,shouldOpenModal:shouldOpen,shouldHeartbeat:shouldHb,now};
    }

async function lockingApplyCountdown(s)
    {
    await state.setValue('lockSecondsLeft',_n(s,0));
    }

async function lockingMarkModalShown()
    {
    await state.setValue('lockCountdownModalShown',true);
    await state.setValue('lockShouldOpenModal',true);
    }

async function lockingMarkHeartbeat(nowMs)
    {
    const now=_n(nowMs,_clockNow());
    await state.setValue('lastHeartbeatAt',now);
    }

function lockingGetContext()
    {
    return {
      module:state.getValue('lockModule'),
      recordId:state.getValue('lockRecordId'),
      userId:state.getValue('lockUserId')
    };
    }

async function lockingRaisePromptSignal()
    {
    await state.setValue('lockShouldOpenModal',true);
    }

async function lockingClearPromptSignal()
    {
    await state.setValue('lockShouldOpenModal',false);
    }

async function lockingSetClockNow(nowMs)
    {
    await state.setValue('lockClockNowMs',_n(nowMs,0));
    return true;
    }
