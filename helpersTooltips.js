//WAIT FOR DOM READY
document.addEventListener('DOMContentLoaded', function()
{
    //GLOBAL TOOLTIP INITIALIZER FUNCTION
    window.attachTooltip =
        function(targetClass, tooltipText)
        {
            if (!targetClass || !tooltipText)
            {
                return;
            }

            //SELECT ALL MATCHING ELEMENTS
            const elements =
                document.querySelectorAll('.' + targetClass);

            elements.forEach(function(el)
            {
                //PREVENT DOUBLE BINDING
                if (el.getAttribute('data-tooltip-bound') === 'true')
                {
                    return;
                }

                el.setAttribute('data-tooltip', tooltipText);
                el.setAttribute('data-tooltip-bound', 'true');
                el.style.position = 'relative';
                el.style.cursor = 'pointer';
            });
        };

    //OPTIONAL: OBSERVE DOM FOR DYNAMIC RENDER (UI BAKERY SAFE)
    const observer =
        new MutationObserver(function()
        {
            if (window._tooltipConfigs)
            {
                window._tooltipConfigs.forEach(function(cfg)
                {
                    window.attachTooltip(cfg.className, cfg.text);
                });
            }
        });

    observer.observe(document.body,
    {
        childList: true,
        subtree: true
    });

    //STORE CONFIGS SO TOOLTIP REAPPLIES IF RE-RENDERED
    window._tooltipConfigs = [];
});
