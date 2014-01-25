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

describe('instanthangouts integration', function() {

  beforeEach(function() {
    // Runs onLoad once.
    document.body.innerHTML = __html__['index.html'];
    // Forces an additional run of onLoad for subsequent tests.
    main();
  });

  it('inserts Hangout render targets exactly once', function() {
    expect(__html__['index.html']).not.toContain('instanthangouts-target');
    var parents = document.getElementsByClassName(PARENT_CLASS_NAME);

    expect(parents.length).toBe(3);
    for (var i = 0; i < parents.length; i++ ) {
      var parent = parents[i];
      expect(parent.children.length).toBe(1);
      expect(parent.children[0].id).toBe(getRenderTargetId(i));
    }

    main();  // Force a second call to cause errant insertions, if any.
    var parents = document.getElementsByClassName(PARENT_CLASS_NAME);

    expect(parents.length).toBe(3);
    for (var i = 0; i < parents.length; i++) {
      var parent = parents[i];
      expect(parent.children.length).toBe(1);
      expect(parent.children[0].id).toBe(getRenderTargetId(i));
    }
  });

  it('allows plusone.js script tag to be re-inserted', function() {
    expect(__html__['index.html']).not.toContain('plusone.js');
    expect(getGapiScripts().length).toBe(1);
    main();  // Force a second call to cause second insertion.
    expect(getGapiScripts().length).toBe(2);
  });

  it('reads custom global attributes from first parent', function() {
    document.body.innerHTML =
        '<div class="instanthangouts" lang="fr" parsetags="onload"></div>' +
        '<div class="instanthangouts"></div>';
    var globals = getGlobalAttributes(
        document.getElementsByClassName('instanthangouts'));
    expect(globals.lang).toBe('fr');
    expect(globals.parsetags).toBe('onload');
  });

  it('reads default global attributes from first parent', function() {
    document.body.innerHTML = '<div class="instanthangouts"></div>' +
        '<div class="instanthangouts" lang="fr" parsetags="onload"></div>';
    var globals = getGlobalAttributes(
        document.getElementsByClassName('instanthangouts'));
    expect(globals.lang).toBe(DEFAULT_LANG);
    expect(globals.parsetags).toBe(DEFAULT_PARSETAGS);
  });

  it('reads custom local attributes from parents', function() {
    document.body.innerHTML =
        '<div class="instanthangouts"' +
        ' hangout_type="first_hangout_type"' +
        ' publisher_id="first_publisher_id"' +
        ' render="hangout"' +
        ' room_id="first_room_id"' +
        ' topic="first_topic"' +
        ' widget_size="first_widget_size"' +
        ' width="first_width"' +
        '></div>' +
        '<div class="instanthangouts"' +
        ' hangout_type="second_hangout_type"' +
        ' publisher_id="second_publisher_id"' +
        ' render="createhangout"' +
        ' room_id="second_room_id"' +
        ' topic="second_topic"' +
        ' widget_size="second_widget_size"' +
        ' width="second_width"' +
        '></div>';
    var parents = document.getElementsByClassName(PARENT_CLASS_NAME);
    var first = getLocalAttributes(parents[0]);
    var second = getLocalAttributes(parents[1]);

    expect(first.hangout_type).toBe('first_hangout_type');
    expect(first.publisher_id).toBe('first_publisher_id');
    expect(first.render).toBe('hangout');
    expect(first.room_id).toBe('first_room_id');
    expect(first.topic).toBe('first_topic');
    expect(first.widget_size).toBe('first_widget_size');
    expect(first.width).toBe('first_width');

    expect(second.hangout_type).toBe('second_hangout_type');
    expect(second.publisher_id).toBe('second_publisher_id');
    expect(second.render).toBe('createhangout');
    expect(second.room_id).toBe('second_room_id');
    expect(second.topic).toBe('second_topic');
    expect(second.widget_size).toBe('second_widget_size');
    expect(second.width).toBe('second_width');
  });

  it('reads default local attributes from parents', function() {
    document.body.innerHTML = '<div class="instanthangouts"></div>' +
        '<div class="instanthangouts"></div>';
    var parents = document.getElementsByClassName(PARENT_CLASS_NAME);
    var first = getLocalAttributes(parents[0]);
    var second = getLocalAttributes(parents[1]);

    expect(first.hangout_type).toBe(DEFAULT_HANGOUT_TYPE);
    expect(first.publisher_id).toBe(DEFAULT_PUBLISHER_ID);
    expect(first.render).toBe(DEFAULT_RENDER);
    expect(first.room_id).toBe(getRoomId());
    expect(first.topic).toBe(DEFAULT_TOPIC);
    expect(first.widget_size).toBe(DEFAULT_WIDGET_SIZE);
    expect(first.width).toBe(DEFAULT_WIDTH);

    expect(second.hangout_type).toBe(DEFAULT_HANGOUT_TYPE);
    expect(second.publisher_id).toBe(DEFAULT_PUBLISHER_ID);
    expect(second.render).toBe(DEFAULT_RENDER);
    expect(second.room_id).toBe(getRoomId());
    expect(second.topic).toBe(DEFAULT_TOPIC);
    expect(second.widget_size).toBe(DEFAULT_WIDGET_SIZE);
    expect(second.width).toBe(DEFAULT_WIDTH);
  });

});
