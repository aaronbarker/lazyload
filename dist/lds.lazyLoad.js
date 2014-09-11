/*!
* lazyLoad
* @description	loads images onto the page as you scroll down to them
* @version		2.0.0 - 2014 / 09 / 11 
* @author		Aaron Barker
* @requires	ui.core.js (1.8+)
* @copyright	Copyright 2013 by Intellectual Reserve, Inc.
*/
;(function ( $, window, document, undefined ) {
	"use strict";	
	var $window = $(window),
		pluginName = "lazyLoad",
		defaults = {
			lazyClass: "lazy",
			doneClass: "lazyLoadDone",
			placeholder: "data:image/gif;base64,R0lGODlhAQABAPAAAAAAAAAAACH/C1hNUCBEYXRhWE1QRT94cGFja2V0IDE2MDZCIiB4bXBNTTpJbnN0YW5jZUlEPSJ4bXAuaWlkOkZERDQ1MzVGMkZGMTExRTFBQTE4OTE5ODk4MQAh+QQFAAAAACwAAAAAAQABAEACAkQBADs=",
			updateOnResize: true,
			secondaryScroll: "", // if there is a horizontally scrolling element, pass that in to get a scroll event added to it
			attList: ["src", "width", "height", "alt", "class"], // list of data- attributes to make into real attributes in the <img>

			// timings and thresholds
			threshold: 300, // how many pixels in advance before an image comes above the fold should the it be loaded
			resizeDelay: 100, // running on every pixel of a scroll/resize is CPU intensive, delay how much?
			fadeSpeed: 250, // how fast should an image fade
			loadHidden: false, // should the script load hidden images
			mustForce: false, // don't load unless forced (using loadNow). For use in carousels, etc
			srcs: ["2x", "desktop", "mobile"], // in order of what you want to show first if it matches multiple
			srcFallback: "desktop", // which source should we fall back if no tests match (ipad isn't desktop, but you didn't provide mobile)
			tests: { // some basic high level tests for the above srcs. can be overwritten or extended
				"2x": function() {
					return window.devicePixelRatio > 1;
				},
				"mobile": function() {
					return $(window).width() < 600;
				},
				"desktop": function() {
					return $(window).width() > 600;
				}
			}
		};

	// The actual plugin constructor
	function Plugin( element, options ) {
		this.element = $(element);
		this.options = $.extend( {}, defaults, options) ;
		this._defaults = defaults;
		this._name = pluginName;
		this.init();
	}
	$.extend(Plugin.prototype, {
		init: function() {
			this._create();
			this._init();
		},
		_create: function() {
			var opts = this.options,
				self = this,
				elem = self.element,
				widgetName = self.widgetName,
				doneClass = opts.doneClass,
				images = "img." + opts.lazyClass,
				imageSelector;

			self.imageSelector = (opts.loadHidden) ? images : images + ":visible";

			imageSelector = self.imageSelector;

			// add event to ALL matched images (hidden or not). so use images not imageSelector
			$(elem).on("update." + widgetName, images, function(event, force) {
				var $this = $(this);

				//default `force` to false
				force = (force === undefined) ? false : force;

				if ($this.hasClass(doneClass)) {

					self.setSrc($this, self.getSrc($this), force);

				} else {

					self.checkLocation(this, force);
				}

			}).on("loadNow." + widgetName, images, function() {
				self.loadNow(this);
			});
			// make all images (not just visible ones) faded out
			// $(images,elem).css("opacity","0.01");

			// scroll, obvious. resize, could bring more into view. orientation, same.
			$window.add(opts.secondaryScroll).on(["scroll", "resize", "orientationchange"].join("." + widgetName + " "), function() {

				clearTimeout(self.scrollTimer);

				self.scrollTimer = setTimeout(function() {
					var $images = $(imageSelector);

					if (!opts.updateOnResize) {
						$images = $images.not("." + doneClass);
					}

					self.viewportHeight = $window.height();
					self.viewportTopY = $window.scrollTop();
					self.viewportWidth = $window.width();
					self.viewportLeftX = $window.scrollLeft();

					$images.trigger("update." + widgetName);

				}, self.initialized ? opts.resizeDelay : 0);

			});

			self.initialized = true;
		},
		_init: function() {
			var self = this,
				elem = self.element,
				opts = self.options,
				widgetName = self.widgetName,
				noscript = "noscript." + opts.lazyClass;

			self.viewportHeight = $window.height();
			self.viewportTopY = $window.scrollTop();
			self.viewportWidth = $window.width();
			self.viewportLeftX = $window.scrollLeft();

			$(noscript, elem).each(function() {
				var $cur = $(this),
					$img = $("<img>"),
					h = $img.attr("height") || opts.minHeight || "";

				// Apply attributes from attList to new image.
				opts.attList.forEach(function(attr) {
					$img.attr(attr, $cur.data(attr) || "");
				});

				// Apply data values from current image to new image.
				$img.data($cur.data());

				// Add the lazyClass to the new image and an appropriate placeholder image.
				$img.addClass(opts.lazyClass)
					.attr("src", opts.placeholder);

				// If no `height` attribute is set, set it to minHieght in opts
				$img.height(h);

				//remove the noscript
				$cur.replaceWith($img);
				$img.css("opacity", "0.01");
			});

			$(self.imageSelector, elem).not("." + self.options.doneClass).each(function() {
				var $this = $(this),
					newSrc = self.getSrc($this),

					// Load now if in cache, catch errors thrown in some private browsing modes.
					isForce = (function() {
						try {
							return !!sessionStorage.getItem(newSrc);
						} catch (e) {
							return false;
						}
					})();

				$this.trigger("update." + widgetName, isForce);
			});

			$window.trigger("resize." + widgetName);
		},
		checkLocation: function(elem, force) {
			var opts = this.options,
				self = this,
				newSrc,
				extra = (/iphone|ipod/i.test(navigator.userAgent.toLowerCase())) ? 60 : 0,
				$theTarget = $(elem),
				dontForce = !opts.mustForce && !$theTarget.data("mustforce"),

				isInBounds = function() {
					var isInBoundsY = ($theTarget.offset().top < (self.viewportTopY + self.viewportHeight) + opts.threshold + extra),
						isInBoundsX = ($theTarget.offset().left < (self.viewportLeftX + self.viewportWidth) + opts.threshold + extra);

					return isInBoundsY && isInBoundsX;

				};

			// optimized for best short-circuting

			// derive a new source if...
			if (
				// we're forcing or...
				force || (
					//there's been a resize or the target doesn't have a done class and...
					(opts.updateOnResize || !$theTarget.hasClass(opts.doneClass)) &&

					//there is a setting to load hidden images or the target is visible and...
					(opts.loadHidden || $theTarget.is(":visible")) &&

					// the target is in-bounds
					isInBounds() &&

					//we are not compelling a force laod.
					dontForce
				)
			) {
				newSrc = self.getSrc($theTarget);

				self.setSrc($theTarget, newSrc, force);

				if (opts.minHeight && !$theTarget.data("height")) {
					$theTarget.removeAttr("height");
				}

				//mark as done, either way. So we don't keep trying it
				$theTarget.addClass(opts.doneClass);
			}
		},
		getSrc: function(elem) {
			var opts = this.options,
				newSrc, testResult;

			opts.srcs.some(function(src) {

				var elSrc = elem.data(src);

				testResult = typeof opts.tests[src] === "function" ? !! opts.tests[src].call(elem) : !! opts.tests[src];

				if (testResult && elSrc) {

					newSrc = elSrc;
				}

				// Stop iterating if we've found a new src.
				return !!newSrc;
			});

			return newSrc || elem.data(opts.srcFallback);
		},
		setSrc: function($elem, newSrc) {
			var opts = this.options;

			if (newSrc && newSrc !== $elem.attr("src")) {

				$elem.on("load", function() {
					$elem.stop(true).fadeTo(opts.fadeSpeed, 1);
				});

				// set the src to the newSrc so it will load
				$elem.fadeTo(opts.fadeSpeed, 0.01).attr("src", newSrc);

				// our good friend IE8 will put in 1 for h/w if one isn't provided. so remove it if there wasn't one to set
				if (!$elem.data("width")) {
					$elem.removeAttr("width");
				}
				if (!$elem.data("height")) {
					$elem.removeAttr("height");
				}

				// track the image we loaded so we can know to not to wait to load it again this session, we can do it immediately since it won't hurt us (from cache)
				try {
					sessionStorage.setItem(newSrc, "loaded");
				} catch (e) {}

				$elem.off("load."+pluginName).on("load."+pluginName, function() {
					if($.isFunction( opts.onload )){
						opts.onload.call($elem, false);
					}
				});
			}
		},
		// external way to call into script to force a loading of the approrpate source right now
		loadNow: function(elem) {
			// make this load the current image
			this.checkLocation(elem, true);
		}
	});

	// A really lightweight plugin wrapper around the constructor, 
	// preventing against multiple instantiations
	$.fn[ pluginName ] = function ( options ) {
		this.each(function() {
			if ( !$.data( this, "plugin_" + pluginName ) ) {
				$.data( this, "plugin_" + pluginName, new Plugin( this, options ) );
			}
		});

		// chain jQuery functions
		return this;
	};
	$.fn[pluginName].version = "2.0.0";

})( jQuery, window, document );
