//GLOBAL REUSABLE TOOLTIP FUNCTION
window.attachTooltip =
    function(targetClass, tooltipText)
    {
        if (!targetClass || !tooltipText)
        {
            return;
        }

        //ENSURE CSS IS INJECTED ONLY ONCE
        if (!document.getElementById('global-tooltip-style'))
        {
            const style =
                document.createElement('style');

            style.id = 'global-tooltip-style';

            style.innerHTML =
            `
            [data-tooltip]
            {
                position: relative;
            }

            [data-tooltip]::after
            {
                content: attr(data-tooltip);
                position: absolute;
                bottom: 130%;
                left: 50%;
                transform: translateX(-50%);
                background: #222;
                color: #ffffff;
                padding: 6px 10px;
                font-size: 12px;
                border-radius: 6px;
                white-space: nowrap;
                opacity: 0;
                pointer-events: none;
                transition: opacity 0.15s ease-in-out;
                z-index: 9999;
            }

            [data-tooltip]:hover::after
            {
                opacity: 1;
            }
            `;

            document.head.appendChild(style);
        }

        //APPLY TO ALL MATCHING ELEMENTS
        const elements =
            document.querySelectorAll('.' + targetClass);

        elements.forEach(function(el)
        {
            el.setAttribute('data-tooltip', tooltipText);
            el.style.cursor = 'pointer';
        });
    };
