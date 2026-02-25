//GLOBAL REUSABLE TOOLTIP FUNCTION WITH ORIENTATION (FORCES CSS UPDATE)
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

        //REMOVE ANY OLD TOOLTIP STYLE TAGS (FROM PREVIOUS VERSIONS)
        const oldStyle =
            document.getElementById('global-tooltip-style');

        if (oldStyle)
        {
            oldStyle.parentNode.removeChild(oldStyle);
        }

        //INJECT CURRENT CSS
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

        /* TOP */
        [data-tooltip-position="top"]::after
        {
            bottom: 130%;
            left: 50%;
            transform: translateX(-50%);
        }

        /* BOTTOM */
        [data-tooltip-position="bottom"]::after
        {
            top: 130%;
            left: 50%;
            transform: translateX(-50%);
        }

        /* LEFT */
        [data-tooltip-position="left"]::after
        {
            right: 130%;
            top: 50%;
            transform: translateY(-50%);
        }

        /* RIGHT */
        [data-tooltip-position="right"]::after
        {
            left: 130%;
            top: 50%;
            transform: translateY(-50%);
        }

        [data-tooltip]:hover::after
        {
            opacity: 1;
        }
        `;

        document.head.appendChild(style);

        //APPLY TO ALL MATCHING ELEMENTS
        const elements =
            document.querySelectorAll('.' + targetClass);

        elements.forEach(function(el)
        {
            el.setAttribute('data-tooltip', tooltipText);
            el.setAttribute('data-tooltip-position', position);
            el.style.cursor = 'pointer';
        });
    };
