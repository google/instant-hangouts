(function () {

  // Copyright 2014 Google Inc. All Rights Reserved.
  //
  // Licensed under the Apache License, Version 2.0 (the "License");
  // you may not use this file except in compliance with the License.
  // You may obtain a copy of the License at
  //
  //      http://www.apache.org/licenses/LICENSE-2.0
  //
  // Unless required by applicable law or agreed to in writing, software
  // distributed under the License is distributed on an "AS-IS" BASIS,
  // WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  // See the License for the specific language governing permissions and
  // limitations under the License.
  
  /**
   * Instantly create a Google+ Hangout on any web page.
   *
   * This is just an easy-to-use adapter for the Google+ Hangout Button. See
   * https://developers.google.com/+/hangouts/button.
   *
   * We handle details like inserting the script in async mode snd consolidating
   * all arguments onto one HTML element (in the default API they are scattered
   * across the render HTML element, the script element, a window global, and the
   * JS API).
   *
   * We do not support the full Hangouts Button API. In particular, we do not
   * support the initial_apps parameter. This means Instant Hangouts cannot be
   * used as an entry point if you want to run your own application inside a
   * Hangout.
   *
   * We support two modes.
   *
   * The first is widget mode. This mode is the default, and is selected when
   * the value for render is 'hangout'. This mode is not documented in the public
   * API. It creates a largish widget on the page that gives the user a control
   * for creating and joining a Hangout. It also provides a counter of the number
   * of participants currently in the Hangout.
   *
   * This mode supports rooms. A room is a distinct (publisher_id, room_id, topic)
   * 3-tuple. By default we supply the Instant Hangouts publisher_id, set the
   * room_id based on the host page URL, and the topic to 'Instant Hangout'. This
   * means that with zero configuration the room will be unique to the page the
   * user is on, so any user on that page will join the same Hangout. In this
   * mode, the only supported hangout type is 'normal', meaning a Hangout limited
   * to 10 concurrent participants. Width of the widget is set by the 'width'
   * attribute.
   *
   * Sample HTML for widget mode:
   *
   * <script type='text/javascript' src='instanthangouts.js'></script>
   * <div class='instanthangouts'></div>
   *
   * The second supported mode is button. In this mode there is no room support,
   * and every user clicking on the control starts a new Hangout. This mode
   * supports all Hangout types, like Hangouts on Air. Width is set by the
   * 'widget_size' attribute.
   *
   * Sample HTML for button mode:
   *
   * <script type='text/javascript' src='instanthangouts.js'></script>
   * <div class='instanthangouts' render='createhangout'></div>
   *
   * Note the render attribute: this is how all variables are passed.
   *
   * In both cases, users may specify multiple <div class='instanthangouts'>
   * elements, and we will render a separate hangout control into each one. These
   * may be configured separately, except that the 'lang' and 'parsetags' options,
   * which apply globally, are only honored on the first
   * <div class='instanthangouts'> found in the page.
   */
  
  // Default type. See choices at
  // https://developers.google.com/+/hangouts/button#hangout_button_parameters
  // All modes are supported if render is 'createhangout', but only normal is
  // supported if render is 'hangout'. This is not enforced by the API and invalid
  // values are silently ignored.
  var DEFAULT_HANGOUT_TYPE = 'normal';
  // Default widget language code.
  var DEFAULT_LANG = 'en';
  // Default value for window.___gcfg.parsetags. explicit because we call render
  // ourselves and want to avoid time wasted by DOM traversal.
  var DEFAULT_PARSETAGS = 'explicit';
  // Default publisher_id. We use the id for the Instant Hangouts Plus Page at
  // https://plus.google.com/b/112744459749475398119. Users may specify their own
  // id if they like, but this is not practically necessary since room uniqueness
  // is enforced by having the room_id contain the containing page's URL.
  var DEFAULT_PUBLISHER_ID = '112744459749475398119';
  // Default render mode. Requires publisher_id, room_id, and topic. Choices are
  // 'hangout' for widget that supports rooms and 'createhangout' for plain
  // button with no room support.
  var DEFAULT_RENDER = 'hangout';
  // Default topic, displayed in the Hangout and in the widget (but not button).
  var DEFAULT_TOPIC = 'Instant Hangout';
  // Default width in pixels if render is 'createhangout'. Ignored if render is
  // 'hangout.'
  var DEFAULT_WIDGET_SIZE = '136';
  // Default width in pixels if render is 'hangout'.
  var DEFAULT_WIDTH = '300';
  // URL of the script that provides gapi.hangout.
  var GAPI_URL = 'https://apis.google.com/js/plusone.js';
  // Class of the DOM element that both configures and receives the Hangouts
  // render.
  var PARENT_CLASS_NAME = 'instanthangouts';
  // Valid values for render option to gapi.hangout.render.
  var RENDER_CHOICES = ['createhangout', 'hangout'];
  
  function addOnLoadHook(handler) {
    // Cross-browser shim.
    if (window.addEventListener) {
      window.addEventListener('load', handler, false);
    } else if (window.attachEvent) {
      window.attachEvent('onload', handler);
    }
  }
  
  function configureGlobals(attrs) {
    // When loading gapi asychronously, these two vars must be set through the
    // global config, not through the script tag. They are documented at
    // https://developers.google.com/+/hangouts/button#script_tag_parameters.
    // We set these globals unconditionally, so we will overwrite any values set
    // by the host page before our script is loaded.
    window.___gcfg = {
      // Widget language. Choices:
      // https://developers.google.com/+/web/api/supported-languages
      lang: attrs.lang,
      // Loading mechanism.
      parsetags: attrs.parsetags
    };
  }
  
  function filter(elements, predicateFn) {
    // Returns all elements that match a predicateFn that takes a single element
    // as its argument.
    var matches = [];
  
    for (var i = 0; i < elements.length; i++) {
      var element = elements[i];
  
      if (predicateFn(element)) {
        matches.push(element);
      }
    }
  
    return matches;
  }
  
  function getGapiScripts() {
    // The host page may have any number of <script>s that loaded GAPI_URL.
    return filter(document.getElementsByTagName('script'), function(script) {
      return script.src == GAPI_URL;
    });
  }
  
  function getLocalAttributes(element) {
    // Attributes local to one render target.
    return {
      hangout_type: element.getAttribute('hangout_type') ||
          DEFAULT_HANGOUT_TYPE,
      publisher_id: element.getAttribute('publisher_id') ||
          DEFAULT_PUBLISHER_ID,
      render: element.getAttribute('render') || DEFAULT_RENDER,
      room_id: element.getAttribute('room_id') || getRoomId(),
      topic: element.getAttribute('topic') || DEFAULT_TOPIC,
      widget_size: element.getAttribute('widget_size') || DEFAULT_WIDGET_SIZE,
      width: element.getAttribute('width') || DEFAULT_WIDTH
    };
  }
  
  function getGlobalAttributes(parents) {
    // Attributes global to all render targets. Read them from the first render
    // target in the DOM and ignore the others.
    return {
      lang: parents[0].getAttribute('lang') || DEFAULT_LANG,
      parsetags: parents[0].getAttribute('parsetags') || DEFAULT_PARSETAGS
    };
  }
  
  function getRender(value) {
    var match = false;
    var render = value || DEFAULT_RENDER;
  
    // No Array.indexOf in IE8.
    for (var i = 0; i < RENDER_CHOICES.length; i++) {
      if (render === RENDER_CHOICES[i]) {
        match = true;
      }
    }
  
    if (!match) {
      log('Invalid render value "' + render + '". Choices are: ' +
          RENDER_CHOICES.join(' '));
    }
  
    return render;
  }
  
  function getRenderTargetId(n) {
    return PARENT_CLASS_NAME + '-target-' + n;
  }
  
  function getRoomId() {
    // Room names must be unique to the page.
    return 'room_' + (window.location.href || '/');
  }
  
  function insertGapiScript(attrs, callback) {
    // Insert even if already present, to force callback.
    var gapiScripts = getGapiScripts();
  
    if (gapiScripts.length >= 1) {
      log(GAPI_URL +
          ' script already loaded; did you accidentally include it twice?');
    }
  
    var script = document.createElement('script');
    script.async = true;
    script.onload = callback;
    script.type = 'text/javascript';
    script.src = GAPI_URL;
    var firstScript = document.getElementsByTagName('script')[0];
    firstScript.parentNode.insertBefore(script, firstScript);
  }
  
  function insertRenderTargets(parents) {
    // Create render target inside each receiving div exactly once.
    for (var i = 0; i < parents.length; i++) {
      var parent = parents[i];
      var renderTargetId = getRenderTargetId(i);
  
      if (document.getElementById(renderTargetId)) {
        return;
      }
  
      var target = document.createElement('div');
      target.id = renderTargetId;
      parent.appendChild(target);
    }
  }
  
  function log(message) {
    // Cross-browser shim.
    if (console && console.log) {
      console.log(message);
    }
  }
  
  function main() {
    // Extracted for tests.
    var parents = document.getElementsByClassName(PARENT_CLASS_NAME);
    if (parents.length == 0) {
      log('No div elements of class ' + PARENT_CLASS_NAME + ' found');
      return;
    }
    var globals = getGlobalAttributes(parents);
    populateDom(globals, makeRenderFunction(parents));
  }
  
  function makeRenderFunction(parents) {
    // Render all targets.
    return function() {
      for (var i = 0; i < parents.length; i++) {
        var locals = getLocalAttributes(parents[i]);
        gapi.hangout.render(getRenderTargetId(i), {
          hangout_type: locals.hangout_type,
          publisher_id: locals.publisher_id,
          render: locals.render,
          room_id: locals.room_id,
          topic: locals.topic,
          widget_size: locals.widget_size,
          width: locals.width
        });
      }
    };
  }
  
  function populateDom(globals, callback) {
    var parents = document.getElementsByClassName(PARENT_CLASS_NAME);
    configureGlobals(globals);
    insertRenderTargets(parents);
    insertGapiScript(globals, callback);
  }
  
  addOnLoadHook(main);  // For browser execution.
  
}());
