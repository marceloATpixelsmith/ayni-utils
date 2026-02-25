//GLOBAL REUSABLE TOOLTIP FUNCTION WITH ORIENTATION (BULLETPROOF)
window.attachTooltip =
    function(targetClass, tooltipText, orientation)
    {
        if (!targetClass || !tooltipText)
        {
            return;
        }

        //NORMALIZE ORIENTATION
        const position =
            String(orientation || 'top')
                .toLowerCase()
                .trim();

        //REMOVE ANY PREVIOUS TOOLTIP STYLES WE INJECTED
        const priorStyles =
            document.querySelectorAll('style[data-tooltip-style="true"]');

        priorStyles.forEach(function(node)
        {
            node.parentNode.removeChild(node);
        });

        //INJECT CURRENT CSS (HIGH SPECIFICITY + EXPLICIT RESETS)
        const style =
            document.createElement('style');

        style.setAttribute('data-tooltip-style', 'true');

        style.innerHTML =
        `
        /*BASE TOOLTIP*/
        [data-tooltip][data-tooltip-position]
        {
            position: relative !important;
        }

        [data-tooltip][data-tooltip-position]::after
        {
            content: attr(data-tooltip);
            position: absolute !important;

            /*RESET ALL SIDES SO OLD CSS CAN'T "WIN"*/
            top: auto !important;
            right: auto !important;
            bottom: auto !important;
            left: auto !important;

            background: #222 !important;
            color: #ffffff !important;
            padding: 6px 10px !important;
            font-size: 12px !important;
            border-radius: 6px !important;
            white-space: nowrap !important;
            opacity: 0 !important;
            pointer-events: none !important;
            transition: opacity 0.15s ease-in-out !important;
            z-index: 999999 !important;
        }

        /*TOP*/
        [data-tooltip][data-tooltip-position="top"]::after
        {
            bottom: 130% !important;
            left: 50% !important;
            transform: translateX(-50%) !important;
        }

        /*BOTTOM*/
        [data-tooltip][data-tooltip-position="bottom"]::after
        {
            top: 130% !important;
            left: 50% !important;
            transform: translateX(-50%) !important;
        }

        /*LEFT*/
        [data-tooltip][data-tooltip-position="left"]::after
        {
            right: 130% !important;
            top: 50% !important;
            transform: translateY(-50%) !important;
        }

        /*RIGHT*/
        [data-tooltip][data-tooltip-position="right"]::after
        {
            left: 130% !important;
            top: 50% !important;
            transform: translateY(-50%) !important;
        }

        [data-tooltip][data-tooltip-position]:hover::after
        {
            opacity: 1 !important;
        }
        `;

        document.head.appendChild(style);

        //APPLY ATTRIBUTES
        const elements =
            document.querySelectorAll('.' + targetClass);

        elements.forEach(function(el)
        {
            el.setAttribute('data-tooltip', tooltipText);
            el.setAttribute('data-tooltip-position', position);
            el.style.cursor = 'pointer';
        });

        //DEBUG LOG (CONFIRMS WHAT WAS ACTUALLY SET)
        console.log('//TOOLTIP APPLIED:',
        {
            targetClass: targetClass,
            tooltipText: tooltipText,
            orientation: position,
            matchedCount: elements.length,
            samplePositionAttr: elements[0] ? elements[0].getAttribute('data-tooltip-position') : null
        });
    };
