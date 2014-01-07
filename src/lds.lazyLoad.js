/*!
 * lazyLoad
 * @description	loads images onto the page as you scroll down to them
 * @version		@@version - @@date
 * @author		Aaron Barker
 * @requires	ui.core.js (1.8+)
 * @copyright	Copyright 2013 by Intellectual Reserve, Inc.
 */
(function($) {
	"use strict";
	$.widget("lds.lazyLoad", {
		options: {
			lazyClass: "lazy",
			doneClass:"lazyLoadDone",
			placeholder:"data:image/gif;base64,R0lGODlhAQABAPAAAAAAAAAAACH/C1hNUCBEYXRhWE1QRT94cGFja2V0IDE2MDZCIiB4bXBNTTpJbnN0YW5jZUlEPSJ4bXAuaWlkOkZERDQ1MzVGMkZGMTExRTFBQTE4OTE5ODk4MQAh+QQFAAAAACwAAAAAAQABAEACAkQBADs=",
			updateOnResize:true,
			// secondaryScroll:"", // if there is a horizontally scrolling element, pass that in to get a scroll event added to it
			attList: ["src","width","height","alt","class"], // list of data- attributes to make into real attributes in the <img>
			// timings and thresholds
			threshold: 300, // how many pixels in advance before an image comes above the fold should the it be loaded
			resizeDelay:100, // running on every pixel of a scroll/resize is CPU intensive, delay how much?
			fadeSpeed:500, // how fast should an image fade in
			loadHidden:false, // should the script load hidden images
			mustForce:false, // don't load unless forced (using loadNow). For use in carousels, etc
			srcs: ["2x","desktop","mobile"], // in order of what you want to show first if it matches multiple
			srcFallback: "desktop", // which source should we fall back if no tests match (ipad isn't desktop, but you didn't provide mobile)
			tests:{ // some basic high level tests for the above srcs. can be overwritten or extended
				"2x":function(){return window.devicePixelRatio > 1;},
				"mobile":function(){return $(window).width() < 600;},
				"desktop": function(){return $(window).width() > 600;}
			}
		},
		_create: function() {
			var opts = this.options, self = this, elem = self.element,
				widgetName = self.widgetName,
				doneClass = opts.doneClass,
				images = "img."+opts.lazyClass,
				imageSelector, newSrc;
			self.imageSelector = images;
			if(!opts.loadHidden){
				self.imageSelector = images+":visible";
			}
			imageSelector = self.imageSelector;
			
			// console.debug(imageSelector);
			// add event to ALL matched images (hidden or not). so use images not imageSelector
			$(elem).delegate(images,"update."+widgetName,function(event,force){
				if($(this).hasClass(doneClass)){
					newSrc = self.getSrc($(this));
					self.setSrc($(this),newSrc,force);
				} else {
					self.checkLocation(this,force);
				}
			}).delegate(images,"loadNow."+widgetName,function(){
				self.loadNow(this);
			});
			// make all images (not just visible ones) faded out
			$(images,elem).css("opacity","0.01");
			// scroll, obvious. resize, could bring more into view. orientation, same.
			$(window).add(opts.secondaryScroll).bind("scroll."+widgetName+" resize."+widgetName+" orientationchange."+widgetName,function(){
				clearTimeout(self.scrollTimer);
				self.scrollTimer = setTimeout(function(){
					var images = $(imageSelector);
					if(!opts.updateOnResize){
						images = images.not("."+doneClass);
					}
					// console.debug(imageSelector,images);
					self.viewportHeight = $(window).height();
					self.viewportTopY = $(window).scrollTop();
					self.viewportWidth = $(window).width();
					self.viewportLeftX = $(window).scrollLeft();

					images.trigger("update."+widgetName,false);
				},self.initialized?opts.resizeDelay:0);
				
			});
			self.initialized = true;
		},
		_init: function () {
			var self = this, elem = self.element, opts = self.options,
				widgetName = self.widgetName,
				noscript = "noscript."+opts.lazyClass;
			
			$(noscript,elem).each(function(){
				var cur = $(this),
					img = $("<img>");
				$.each(opts.attList,function(index,value){
					if(cur.data(value)){
						// console.debug(cur.data(value));
						img.attr(value,cur.data(value)||"");
					}
				});
				$.each(cur.data(),function(index,value){
					img.data(index,value);
				});
				img.addClass(opts.lazyClass)
					.attr("src",opts.placeholder);
				if(!img.attr("height") && opts.minHeight){
					img.attr("height",opts.minHeight);
				}
				$(this).before(img);
				//remove the noscript
				cur.remove();
			});

			$(self.imageSelector, elem).not("."+self.options.doneClass).each(function(){
				// check the sessionStorage to see if we have loaded this one before. If so, it's cached so load it now instead of waiting for a timer (more for mobile)
				var newSrc = self.getSrc($(this));
				// if we've tracked this src, then load it now. It won't hurt us since it's from cache
				if(sessionStorage.getItem(newSrc)){
					// console.debug("loading "+newSrc+"thanks to sessionStorage");
					$(this).trigger("update."+widgetName,true);
				} else {
					$(this).trigger("update."+widgetName,false);
				}
			});
			$(window).trigger("resize."+widgetName);
		},
		checkLocation:function(elem,force){
			var opts = this.options, self = this,
				newSrc,
				extra = (/iphone|ipod/i.test(navigator.userAgent.toLowerCase()))?60:0,
				theTarget = $(elem);
				// console.debug(theTarget);
			if(((!theTarget.hasClass(opts.doneClass) || opts.updateOnResize) && (opts.loadHidden || (!opts.loadHidden && theTarget.is(":visible"))) && (theTarget.offset().top < (self.viewportTopY + self.viewportHeight) + opts.threshold + extra) && (theTarget.offset().left < (self.viewportLeftX + self.viewportWidth) + opts.threshold + extra) && !opts.mustForce && !theTarget.data("mustforce")) || force ){
				newSrc = self.getSrc(theTarget);
				
				self.setSrc(theTarget,newSrc,force);
				if(opts.minHeight && !theTarget.data("height")){
					theTarget.attr("height","");
				}
				//mark as done, either way. So we don't keep trying it
				theTarget.addClass(opts.doneClass);

			}
		},
		getSrc:function(elem){
			var opts = this.options,
				newSrc, testResult;
			$.each(opts.srcs,function(key, value){
				testResult = typeof(opts.tests[value]) === "function"?opts.tests[value].call():opts.tests[value];
				// console.debug("testing ",value, testResult);

				if(elem.data(value) && opts.tests[value].call()){
					// console.debug("is",value);
					newSrc = elem.data(value);
					return false;
				}
			});
			if(!newSrc){
				newSrc = elem.data(opts.srcFallback);
			}
			return newSrc;
		},
		setSrc:function(elem,newSrc,force){
			var opts = this.options, self= this;
			if(newSrc && newSrc !== elem.attr("src")){
				// console.debug("loading "+newSrc);
				// set the src to the newSrc so it will load
				elem.attr("src",newSrc).fadeTo(force?0:opts.fadeSpeed,1);
				// track the image we loaded so we can know to not to wait to load it again this session, we can do it immediately since it won't hurt us (from cache)
				// our good friend IE8 will put in 1 for h/w if one isn't provided. so remove it if there wasn't one to set
				if(!elem.data("width")){
					elem.removeAttr("width");
				}
				if(!elem.data("height")){
					elem.removeAttr("height");
				}
				sessionStorage.setItem(newSrc,"loaded");
				elem.off("load.lazyLoad").on("load.lazyLoad",function(){
					self._trigger("onload", false, elem);
				});
			}
		},
		// external way to call into script to force a loading of the approrpate source right now
		loadNow: function(elem){
			// make this load the current image
			this.checkLocation(elem,true);
		},
		destroy: function() {
			$.Widget.prototype.destroy.apply(this, arguments); // call the default stuff
			$(this.element).add(window).unbind("."+this.widgetName);
		}
		
	});
	$.extend( $.lds.lazyLoad, {
		version: "@@version"
	});
})(jQuery);