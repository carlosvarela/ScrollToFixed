/**
 * This plugin is used to fix elements to the top of the page, if the element
 * would have been scrolled out of view, vertically; however, it does allow the
 * element to continue to move left or right with the horizontal scroll.
 * 
 * Given an option marginTop, the element will stop moving vertically upward
 * once the vertical scroll has reached the target position; but, the
 * element will still move horizontally as the page is scrolled left or right.
 * Once the page has been scrolled back down passed the target position, the
 * element will be restored to its original position on the page.
 * 
 * This plugin has been tested in Firefox 3/4, Google Chrome 10/11, Safari 5,
 * and Internet Explorer 8/9.
 */
(function($) {
    $.ScrollToFixed = function(el, options) {
        // To avoid scope issues, use 'base' instead of 'this' to reference this
        // class from internal events and functions.
        var base = this;

        // Access to jQuery and DOM versions of element.
        base.$el = $(el);
        base.el = el;

        // Add a reverse reference to the DOM object.
        base.$el.data("ScrollToFixed", base);

        // A flag so we know if the scroll has been reset.
        var isReset = false;

        // The element that was given to us to fix if scrolled above the top of
        // the page.
        var target = base.$el;

        // The offset top of the element when resetScroll was called. This is
        // used to determine if we have scrolled past the top of the element.
        var offsetTop = 0;

        // The offset left of the element when resetScroll was called. This is
        // used to move the element left or right relative to the horizontal
        // scroll.
        var offsetLeft = 0;

        // This is the last offset used to move the element horizontally. This
        // is used to determine if we need to move the element because we would
        // not want to do that for no reason.
        var lastOffsetLeft = -1;

        // This is the element used to fill the void left by the target element
        // when it goes fixed; otherwise, everything below it moves up the page.
        var spacer = null;

        // Capture the original offsets for the target element. This needs to be
        // called whenever the page size changes or when the page is first
        // scrolled. For some reason, calling this before the page is first
        // scrolled causes the element to become fixed too late.
        function resetScroll() {
            // Set the element to it original positioning.
            setUnfixed();

            // Reset the last offset used to determine if the page has moved
            // horizontally.
            lastOffsetLeft = -1;

            // Capture the offset top of the target element.
            offsetTop = target.offset().top;

            // Capture the offset left of the target element.
            offsetLeft = target.offset().left;

            // Set that this has been called at least once.
            isReset = true;
        }

        // Sets the target element to fixed. Also, sets the spacer to fill the
        // void left by the target element.
        function setFixed() {
            // Check to see if the target element is already fixed.
            var fixed = target.css('position') == 'fixed';

            // Only fix the target element and the spacer if we need to.
            if (!fixed) {
                // Set the spacer to fill the height and width of the target
                // element, then display it.
                spacer.css({
                    'display' : target.css('display'),
                    'width' : target.outerWidth(true),
                    'height' : target.outerHeight(true)
                });

                // Set the target element to fixed and set its width so it does
                // not fill the rest of the page horizontally. Also, set its top
                // to the margin top specified in the options.
                target.css({
                    'width' : target.width(),
                    'position' : 'fixed',
                    'top' : base.options.marginTop
                });
            }
        }

        // Sets the target element back to unfixed. Also, hides the spacer.
        function setUnfixed() {
            // Check to see if the target element is already not fixed.
            var fixed = target.css('position') == 'fixed';

            // Only unfix the target element and the spacer if we need to.
            if (fixed) {
                // Hide the spacer now that the target element will fill the
                // space.
                spacer.css('display', 'none');

                // Remove the target's style attributes. This will reverse them
                // back to the target element's orginal style.
                target.css({
                    'width' : '',
                    'position' : '',
                    'left' : '',
                    'top' : ''
                });
            }
        }

        // Moves the target element left or right relative to the horizontal
        // scroll position.
        function setleft(x) {
            // Hold the last horizontal position set.
            lastOffsetLeft = x;

            // Move the target element horizontally relative to its original
            // horizontal position.
            target.css('left', offsetLeft - x);
        }

        // Checks to see if we need to do something based on new scroll position
        // of the page.
        function checkScroll() {
            // If resetScroll has not yet been called, call it. This only
            // happens once.
            if (!isReset) {
                resetScroll();
            }

            // Grab the current horizontal scroll position.
            var x = $(window).scrollLeft();

            // Grab the current vertical scroll position.
            var y = $(window).scrollTop();

            // If the vertical scroll position, plus the optional margin, would
            // put the target element above the top of the page, set the target
            // element to fixed.
            if (y >= offsetTop - base.options.marginTop) {
                // If the page has been scrolled horizontally as well, move the
                // target element accordingly.
                if (x != lastOffsetLeft) {
                    setleft(x);
                }

                // Set the target element to fixed.
                setFixed();
            } else {
                // Set the target element to unfixed, placing it where it was
                // before.
                setUnfixed();
            }
        }

        // Initializes this plugin. Captures the options passed in, turns this
        // off for iOS, adds the spacer, and binds to the window scroll and
        // resize events.
        base.init = function() {
            // Capture the options for this plugin.
            base.options = $
                    .extend({}, $.ScrollToFixed.defaultOptions, options);

            // Turn off this functionality for iOS devices until we figure out
            // what to do with them, or until iOS5 comes out which is supposed
            // to support position:fixed.
            if (navigator.platform == 'iPad' || navigator.platform == 'iPhone'
                    || navigator.platform == "iPod") {

                return;
            }

            // Put the target element on top of everything that could be below
            // it. This reduces flicker when the target element is transitioning
            // to fixed.
            base.$el.css('z-index', 1000);

            // Create a spacer element to fill the void left by the target
            // element when it goes fixed.
            spacer = $('<div/>');

            // Place the spacer right after the target element.
            base.$el.after(spacer);

            // Reset the target element offsets when the window is resized, then
            // check to see if we need to fix or unfix the target element.
            $(window).bind('resize', function(event) {
                resetScroll();
                checkScroll();
            });

            // When the window scrolls, check to see if we need to fix or unfix
            // the target element.
            $(window).bind('scroll', function(event) {
                checkScroll();
            });
        };

        // Initialize the plugin.
        base.init();
    };

    // Sets the option defaults.
    $.ScrollToFixed.defaultOptions = {
        marginTop : 0
    };

    // Returns enhanced elements that will fix to the top of the page when the
    // page is scrolled.
    $.fn.scrollToFixed = function(options) {
        return this.each(function() {
            (new $.ScrollToFixed(this, options));
        });
    };
})(jQuery);