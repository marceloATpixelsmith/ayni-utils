//UI BAKERY-LIKE FLOATING TOOLTIP (NO ATTRIBUTES REQUIRED)
window.attachTooltip =
    function(className, tooltipText, orientation)
    {
        if (!className || !tooltipText)
        {
            return;
        }

        const position =
            String(orientation || "top")
                .toLowerCase()
                .trim();

        //REMOVE OLDER TOOLTIP STYLE TAGS FROM PREVIOUS ATTEMPTS (BLACK BUBBLE CSS)
        const oldTooltipStyles =
            document.querySelectorAll('style[data-tooltip-style="true"], style#global-tooltip-style');

        oldTooltipStyles.forEach(function(node)
        {
            node.parentNode.removeChild(node);
        });

        //INJECT UI BAKERY-LIKE STYLES ONCE
        if (!document.getElementById("ub_like_tooltip_style"))
        {
            const style =
                document.createElement("style");

            style.id = "ub_like_tooltip_style";

            style.textContent =
                `
                .ub-like-tooltip
                {
                    position: fixed;
                    display: none;
                    background: #ffffff;
                    color: #2e2e2e;
                    border: 1px solid rgba(0, 0, 0, 0.12);
                    border-radius: 8px;
                    padding: 8px 12px;
                    font-size: 16px;
                    line-height: 1.2;
                    white-space: nowrap;
                    box-shadow: 0 6px 14px rgba(0, 0, 0, 0.12);
                    z-index: 999999;
                    pointer-events: none;
                }

                .ub-like-tooltip::after
                {
                    content: "";
                    position: absolute;
                    width: 12px;
                    height: 12px;
                    background: #ffffff;
                    border: 1px solid rgba(0, 0, 0, 0.12);
                    transform: rotate(45deg);
                }

                .ub-like-tooltip.pos-top::after
                {
                    bottom: -7px;
                    left: 50%;
                    margin-left: -6px;
                    border-left: none;
                    border-top: none;
                }

                .ub-like-tooltip.pos-bottom::after
                {
                    top: -7px;
                    left: 50%;
                    margin-left: -6px;
                    border-right: none;
                    border-bottom: none;
                }

                .ub-like-tooltip.pos-left::after
                {
                    right: -7px;
                    top: 50%;
                    margin-top: -6px;
                    border-left: none;
                    border-bottom: none;
                }

                .ub-like-tooltip.pos-right::after
                {
                    left: -7px;
                    top: 50%;
                    margin-top: -6px;
                    border-right: none;
                    border-top: none;
                }
                `;

            document.head.appendChild(style);
        }

        //CREATE SINGLE TOOLTIP NODE ONCE
        let tooltipEl =
            document.getElementById("ub_like_tooltip");

        if (!tooltipEl)
        {
            tooltipEl =
                document.createElement("div");

            tooltipEl.id = "ub_like_tooltip";
            tooltipEl.className = "ub-like-tooltip pos-top";

            document.body.appendChild(tooltipEl);
        }

        const setPositionClass =
            function(pos)
            {
                tooltipEl.classList.remove("pos-top", "pos-bottom", "pos-left", "pos-right");

                if (pos === "bottom")
                {
                    tooltipEl.classList.add("pos-bottom");
                }
                else if (pos === "left")
                {
                    tooltipEl.classList.add("pos-left");
                }
                else if (pos === "right")
                {
                    tooltipEl.classList.add("pos-right");
                }
                else
                {
                    tooltipEl.classList.add("pos-top");
                }
            };

        const showTooltip =
            function(targetEl)
            {
                tooltipEl.textContent = tooltipText;
                setPositionClass(position);

                tooltipEl.style.display = "block";

                const rect =
                    targetEl.getBoundingClientRect();

                const tipRect =
                    tooltipEl.getBoundingClientRect();

                const gap =
                    10;

                let left =
                    0;

                let top =
                    0;

                if (position === "bottom")
                {
                    left = rect.left + (rect.width / 2) - (tipRect.width / 2);
                    top = rect.bottom + gap;
                }
                else if (position === "left")
                {
                    left = rect.left - tipRect.width - gap;
                    top = rect.top + (rect.height / 2) - (tipRect.height / 2);
                }
                else if (position === "right")
                {
                    left = rect.right + gap;
                    top = rect.top + (rect.height / 2) - (tipRect.height / 2);
                }
                else
                {
                    left = rect.left + (rect.width / 2) - (tipRect.width / 2);
                    top = rect.top - tipRect.height - gap;
                }

                //CLAMP TO VIEWPORT
                const pad =
                    8;

                if (left < pad)
                {
                    left = pad;
                }

                if (left + tipRect.width > window.innerWidth - pad)
                {
                    left = window.innerWidth - tipRect.width - pad;
                }

                if (top < pad)
                {
                    top = pad;
                }

                if (top + tipRect.height > window.innerHeight - pad)
                {
                    top = window.innerHeight - tipRect.height - pad;
                }

                tooltipEl.style.left = left + "px";
                tooltipEl.style.top = top + "px";
            };

        const hideTooltip =
            function()
            {
                tooltipEl.style.display = "none";
            };

        //BIND TO ELEMENTS BY CLASS (NO ATTRIBUTES)
        const els =
            document.querySelectorAll("." + className);

        els.forEach(function(el)
        {
            //HARD-KILL NATIVE TOOLTIP IF IT EXISTS ON CHILDREN (SVG/NB-ICON SOMETIMES GETS TITLE)
            const titled =
                el.querySelectorAll("[title]");

            titled.forEach(function(t)
            {
                t.removeAttribute("title");
            });

            //PREVENT DOUBLE BINDING
            if (el.__ubTooltipBound === true)
            {
                return;
            }

            el.__ubTooltipBound = true;
            el.style.cursor = "pointer";

            el.addEventListener("mouseenter", function()
            {
                showTooltip(el);
            });

            el.addEventListener("mouseleave", function()
            {
                hideTooltip();
            });
        });
    };
