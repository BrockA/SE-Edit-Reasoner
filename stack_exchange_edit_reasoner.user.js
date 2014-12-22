// ==UserScript==
// @name        Stack Exchange, Edit Reasoner
// @description Makes entering standard edit reasons a snap.
// @match       *://*.askubuntu.com/*
// @match       *://*.mathoverflow.net/*
// @match       *://*.onstartups.com/*
// @match       *://*.serverfault.com/*
// @match       *://*.stackapps.com/*
// @match       *://*.stackexchange.com/*
// @match       *://*.stackoverflow.com/*
// @match       *://*.superuser.com/*
// @require     http://ajax.googleapis.com/ajax/libs/jquery/2.1.0/jquery.min.js
// @require     https://gist.github.com/raw/2625891/waitForKeyElements.js
// @resource    setBtn  https://raw.githubusercontent.com/BrockA/SE-Edit-Reasoner/master/images/settings.png
// @grant       GM_addStyle
// @grant       GM_setValue
// @grant       GM_getValue
// @grant       GM_getResourceURL
// @version     1.0
// @history     1.0 Initial release
// ==/UserScript==
/*--- Notes:
    On reviews or re-edits, keep the existing reason until a btn is pushed.
    The max length of a reason is 300 characters.  We let the site check for that, but keep it in mind.
*/
var reasonArray;
var siteCustomList  = GM_getValue ("sitesWithCustomLists");
//var reasonArray     = GM_getValue ("");

var reasonArray     = [
    //Format: [<label>, <Reason text>]
    ["Tags",            'better tags'],
    ["Thanks",          'removed thanks'],
    ["Sign",            'removed signature'],
    ["Greeting",        'removed greeting'],
    ["Links",           'formatted links'],
    ["Code",            'formatted code'],
    ["Format",          'fixed formatting'],
    ["Grammar",         'fixed grammar'],
    ["Spelling",        'fixed spelling'],
    ["Title",           'better title'],
];
var setBtnSrc       = GM_getResourceURL ("setBtn");

waitForKeyElements (".inline-post, .post-form", addReasonControls);

function addReasonControls (jNode) {
    var editNd          = jNode.find (".form-item").has ("#edit-comment, .edit-comment");
    if (editNd.length === 0)    return true;

    //--- Add edit-reason controls
    var editControls    = $('<div class="gmEditControls"></div>');
    $.each (reasonArray, function () {
        //-- this = [<label>, <Reason text>]
        editControls.append (
            '<label><input type="checkbox" value="' + this[1] + '">' + this[0] + '</label>'
        );
    } );

    var targTabIndex    = editNd.find ("#edit-comment, .edit-comment").first ()
                        .prop ("tabIndex") - 1
                        ;
    editControls.find ("input").prop ("tabIndex", targTabIndex);

    editControls.append ('<img src="' + setBtnSrc + '" alt="settings" title="Script settings">');

    editControls.prependTo (editNd);
}

$("#content").on ("change", ".gmEditControls input[type='checkbox']",  function (zEvent) {
    var jThis       = $(this);
    var chckdBoxes  = jThis.parent ().parent ().find ("input:checked");
    var chckdText   = chckdBoxes.map ( function () { return this.value; } ).get ();
    var finalText   = chckdText.join (", ") + ".";
    finalText       = finalText.substr (0, 1).toLocaleUpperCase () + finalText.slice (1);

    var reasonInput = jThis.parents (".form-item").find ("#edit-comment, .edit-comment");
    //-- Clear overlay / help prompt while setting value.
    reasonInput.focus ();
    reasonInput.val (finalText);
    reasonInput.change ();
    jThis.focus ();
} );
$("#content").on ("focus blur", ".gmEditControls input[type='checkbox']",  function (zEvent) {
    var jThis       = $(this);

    if (zEvent.type == "focusin")
        jThis.parent ().css ("background", "lightyellow");
    else
        jThis.parent ().css ("background", "");
} );

GM_addStyle ( multilineStr ( function () {/*!
    .gmEditControls {
        margin-bottom: 1ex;
        position: relative;
    }
    .gmEditControls label {
        color: black;
        cursor: pointer;
        display: inline-block;
        font-weight: normal;
        line-height: 1.5;
        margin-right: 1em;
        padding: 0 0.3ex;
    }
    .gmEditControls label:hover {
        background: lightyellow;
    }
    .gmEditControls label > input {
        margin-right: 0.3ex;
    }
    .gmEditControls img {
        position: absolute;
        padding: 0.2ex;
        right: 0;
        top: 0;
    }
    .gmEditControls img:hover {
        background: lightyellow;
    }
*/} ) );

function multilineStr (dummyFunc) {
    var str = dummyFunc.toString ();
    str     = str.replace (/^[^\/]+\/\*!?/, '') // Strip function() { /*!
            .replace (/\s*\*\/\s*\}\s*$/, '')   // Strip */ }
            .replace (/\/\/.+$/gm, '') // Double-slash comments wreck CSS. Strip them.
            ;
    return str;
}
