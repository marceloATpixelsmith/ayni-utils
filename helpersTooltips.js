//UI BAKERY-LIKE TOOLTIP (FLOATING, WITH ARROW, ORIENTATION SUPPORT)
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

        //INJECT STYLES ONCE
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

                /*ARROW BASE*/
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

                /*TOP ARROW (POINTS DOWN)*/
                .ub-like-tooltip.pos-top::after
                {
                    bottom: -7px;
                    left: 50%;
                    margin-left: -6px;
                    border-left: none;
                    border-top: none;
                }

                /*BOTTOM ARROW (POINTS UP)*/
                .ub-like-tooltip.pos-bottom::after
                {
                    top: -7px;
                    left: 50%;
                    margin-left: -6px;
                    border-right: none;
                    border-bottom: none;
                }

                /*LEFT ARROW (POINTS RIGHT)*/
                .ub-like-tooltip.pos-left::after
                {
                    right: -7px;
                    top: 50%;
                    margin-top: -6px;
                    border-left: none;
                    border-bottom: none;
                }

                /*RIGHT ARROW (POINTS LEFT)*/
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

        //CREATE SINGLETON TOOLTIP NODE ONCE
        if (!document.getElementById("ub_like_tooltip"))
        {
            const tip =
                document.createElement("div");

            tip.id = "ub_like_tooltip";
            tip.className = "ub-like-tooltip pos-top";

            document.body.appendChild(tip);
        }

        const tooltipEl =
            document.getElementById("ub_like_tooltip");

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

                //MEASURE AFTER DISPLAY
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
                    //TOP
                    left = rect.left + (rect.width / 2) - (tipRect.width / 2);
                    top = rect.top - tipRect.height - gap;
                }

                //KEEP WITHIN VIEWPORT
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

        //BIND TO ALL MATCHING ELEMENTS (IDEMPOTENT)
        const els =
            document.querySelectorAll("." + className);

        els.forEach(function(el)
        {
            if (el.getAttribute("data-ub-tooltip-bound") === "true")
            {
                return;
            }

            el.setAttribute("data-ub-tooltip-bound", "true");
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
