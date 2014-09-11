lazyload
========

Lazy load and responsive images together again for the first time.

lazyLoad provides a way to only download to the browser what images are needed for display within the current viewport, then load more as the user interacts with the page. Images that are >300px (default) below the fold are not downloaded. As the user scrolls down (or resizes, or rotates the device), the script continues to load images as the top of a given image gets within 300px of the viewable area. If a user never scrolls, they won't download images they will never see.

### Responsive Images
In addition to lazy loading images, this script also provides a way to do responsive images by providing multiple `src`s and tests to decide which `src` to load. The tests can be simple size limits
```
function(){
	return $(window).width() > 600;
}
```
or complicated functions to only show an image for a retina Mac on Chrome 31 between 2-4pm
```
function(){
	var curDate = new Date(Date.now()),
		hours = curDate.getHours();
	if(window.devicePixelRatio > 1
		&& navigator.userAgent.indexOf("Chrome") > -1
		&&  navigator.userAgent.indexOf("Mac") > -1
		&& (hours => 14 && hours <= 16)){
		return true;
	}
	return false;
}
```
The test should just return a boolean, the plugin doesn't care how you get to the result.

### Caching
Each image that is loaded is saved into sessionStorage with the path of the image as the key. When the lazyLoad runs, it checks sessionStorage for each path and if it is found, will load it onto the page instantly since we know it's in the cache already.

## Requirements
lazyLoad uses jQuery, and that is the only additional requirement.

```
<script src="jquery.js"></script>
<script src="lds.lazyLoad.js"></script>
```

We use a `noscript` element wrapping an image to provide fallback for SEO and browsers with JavaScript turned off. Some IE versions can't see inside a noscript with JavaScript so we can't pull any attributes from the img.  Place them on the `noscript` element as `data-` attributes to be injected with the created `<img>` element.

Also add `data-` attributes of the source(s) of the image(s) you want to have injected.

```
<noscript class="lazy" data-mobile="images/mobile.jpg" data-desktop="images/desktop.jpg" data-alt="description of image">
	<img src="images/desktop.jpg" />
</noscript>
```


Call the script on a wrapping element. This allows additional images to be injected and still work via event delegation.

```
$("body").lazyLoad();
```


## lazyLoad API

### lazyClass
Type: `string`
Default: `lazy`

class used on noscript elements and to use for other plugin generated classes

### doneClass
Type: `string`
Default: `lazyLoadDone`

class to apply to an element after it has been loaded

### placeholder
Type: `string`
Default: `data:image/gif;base64,R0lGODlhAQABAPAAAAAAAAAAACH/C1hNUCBEYXRhWE1QRT94cGFja2V0IDE2MDZCIiB4bXBNTTpJbnN0YW5jZUlEPSJ4bXAuaWlkOkZERDQ1MzVGMkZGMTExRTFBQTE4OTE5ODk4MQAh+QQFAAAAACwAAAAAAQABAEACAkQBADs=`

url (base64 encoded or actual URL) of an image to load as a placeholder until the real image is loaded

### attList
Type: `array`
Default: `["src", "width", "height", "alt", "class"]`

list of data- attributes to make into real attributes in the created <img>

### threshold
Type: `number`
Default: `300`

how many pixels in advance before an image comes above the fold should the image be loaded

### resizeDelay
Type: `number`
Default: `100`

unning on every pixel of a scroll/resize is CPU intensive, delay how much?

### fadeSpeed
Type: `number`
Default: `500`

how fast should an image fade in

### loadHidden
Type: `boolean`
Default: `false`

should the script load hidden images within the threshold

### mustForce
Type: `boolean`
Default: `false`

require the loadNow event to be called, don't load due to scrolling. useful for carousels n such

### updateOnResize
Type: `boolean`
Default: `true`

should the script run tests again on resize. May cause a different sizes image to load

### secondaryScroll
Type: `string`
Default: ``

if there is a horizontally scrolling element, pass the selector in to get a scroll event added to it

### loadAll
Type: `boolean`
Default: `play`

immediate load all images (except hidden ones if loadHidden = false). allows images to wait until onload to load for only delaying loading instead of preventing until within threshold

### srcs
Type: `array`
Default: `["2x", "desktop", "touch"]`

the names of the possible data-* attributes for different src attributes. listed in order of what you want to show first in case it matches multiple

### srcFallback
Type: `string`
Default: `desktop`

which source should we fall back if no tests match (ie: ipad isn't desktop, but you didn't provide mobile)

### tests
Type: `object`
Default: `{ "2x":window.devicePixelRatio > 1,"touch":"ontouchstart" in document.documentElement, "desktop": !("ontouchstart" in document.documentElement)}`

some basic high level tests for the above srcs. can be overwritten or extended. need to be in the same order as the srcs array

### loadNow
Type: `method`
Default: ``

method you can call to load a given image, or custom event on the image itself. useful if you want to load a specific hidden image.  Pass in the image that you want to load

## Changelog
### 2.0.0
* Removed widget factory requirement and moved to [jquery-boilerplate](https://github.com/jquery-boilerplate/jquery-boilerplate) structure.

### 1.5.0
* Fixes a bug where lazyload would fail after the first load when in Private mode in iOS Safari
* The Fade effect on an image now occurs when an image changes as well as when it initally loads.
* Images are fadded out before fadding in so the fade speed option one passes in should now be half what they were in previous versions to achieve the same effect.
* Drops support for IE 8 and lower.

### 1.4.1
* Moving the setting of the image opacity to within the loop where it changes from noscript to placeholder image. When it was just being fired on all images and you called the script multiple times, it would hide images that were already done.

### 1.4.0
* First release onto github. Will fill in older information if time allows.
* Removed some old timer functionality (would load another image every X seconds)
* Replaced URL to an image to a base64 encoded image
* Removed some logic for unused img.lazy stuff in favor of using noscript elements
