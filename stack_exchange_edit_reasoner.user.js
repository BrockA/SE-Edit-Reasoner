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
// @require     http://ajax.googleapis.com/ajax/libs/jqueryui/1.11.1/jquery-ui.min.js
// @require     https://gist.github.com/raw/2625891/waitForKeyElements.js
// @resource    setBtn  https://raw.githubusercontent.com/BrockA/SE-Edit-Reasoner/master/images/settings.png
// @grant       GM_addStyle
// @grant       GM_setValue
// @grant       GM_getValue
// @grant       GM_getResourceURL
// @version     2.0
// @history     2.0 Added configurable options/reasons.
// @history     1.1 Period fix and CSS tweak.
// @history     1.0 Initial release
// @updateURL   https://github.com/BrockA/SE-Edit-Reasoner/raw/master/stack_exchange_edit_reasoner.user.js
// @downloadURL https://github.com/BrockA/SE-Edit-Reasoner/raw/master/stack_exchange_edit_reasoner.user.js
// ==/UserScript==
/*--- Notes:
    1) The max length of a reason is 300 characters.  We let the site check for that, but keep it in mind.
    2) Future?: Add KB shortcut to jump straight to edit reason (too many tabs for some operations).
    3) Future?: Add autofill input for use in retagging  or bulk edit operations. BUT, on reviews or re-edits,
                keep the existing reason until a btn is pushed.
    4) Future?: Auto add and/or remove tags.
    5) Future?: Make a proper SA post and link-in
    6) Future?: Smart, configurable, previewable auto-corrections (especially "i", as Browser tools muff that one).
*/
//var siteCustomList  = GM_getValue ("sitesWithCustomLists");
var reasonArray     = GM_getValue ("reasonArray", "");
if (reasonArray) {
    reasonArray     = JSON.parse (reasonArray);
}
else {
    //-- Use defaults
    reasonArray     = [
        //Format: [<label>, <Reason text>], Recommend most used be first
        ["Title",           'more SEO title'],
        ["Tags",            'more accurate tags'],
        ["Code",            'formatted code'],
        ["Spell/G",         'fixed spelling and/or grammar'],
        ["Format",          'organized for clarity'],
        ["Thanks",          'removed thanks per SE policy'],
        ["Social",          'focused text to the question'],
    ];
}
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

    var targTabIndex    = editNd.find ("#edit-comment, .edit-comment").first ().prop ("tabIndex") - 1;
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
    if (finalText == ".")   finalText = "";

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
$("#content").on ("click", ".gmEditControls > img",  function (zEvent) {
    activateOptionsDialog ();
} );

var initJQUI_CSS    = function () {
    initJQUI_CSS    = function () { return true; }

    /*--- Load jQuery-UI CSS, one time, on demand only.
        We add the CSS this way so that the embedded, relatively linked images load correctly.
    */
    $("head").append (
        '<link '
      + 'href="http://ajax.googleapis.com/ajax/libs/jqueryui/1.11.1/themes/le-frog/jquery-ui.min.css" '
      + 'rel="stylesheet" type="text/css">'
    );
}

function activateOptionsDialog () {
    initJQUI_CSS ();
    removeOptionsDialog ();

    //--- Add our custom dialog using jQuery.
    $("body").append ('<div id="gmOverlayDialog"></div>');

    var editControls    = $('<div class="gmOptionControls"></div>');
    editControls.append ( '                                                                 \
        <table class="gmReasonInpTbl">                                                      \
            <thead>                                                                         \
            <tr>                                                                            \
                <th>Label</th>                                                              \
                <th>Reason text</th>                                                        \
                <th>delete</th>                                                             \
            </tr>                                                                           \
            </thead>                                                                        \
            <tbody>                                                                         \
            </tbody>                                                                        \
        </table>                                                                            \
    ' );
    var controlsTable   = editControls.find (".gmReasonInpTbl > tbody");

    $.each (reasonArray, function () {
        //-- this = [<label>, <Reason text>]
        controlsTable.append ( '                                                            \
            <tr>                                                                            \
                <td><input type="text" value="' + this[0] + '" class="gmLabelTxt"></td>     \
                <td><input type="text" value="' + this[1] + '" class="gmReasonTxt"></td>    \
                <td><div class="popup-close"><a title="Delete this entry.">×</a></div></td> \
            </tr>                                                                           \
        ' );
    } );

    editControls.append (
        '<p>(Drag rows to re-order.)</p>' +
        '<button id="gmAddRow" class="ui-button ui-widget ui-state-default ui-corner-all">New row +</button>'
    );
    //--- Leveraging SE's styles classes for the Save and Cancel buttons:
    editControls.append ( '                                                                             \
        <div class="form-submit">                                                                       \
                <input type="submit" value="Save Changes" id="gmSaveChanges">                           \
                <a class="cancel-edit" href="javascript:void(0)" id="gmCancel">cancel</a>               \
        </div>                                                                                          \
    ' );

    var controlsDialog  = $("#gmOverlayDialog");
    editControls.appendTo (controlsDialog);

    //--- Activate the dialog.
    controlsDialog.dialog ( {
        modal:          false,
        title:          "Set SE-Reasoner options",
        position:       {
               my: "top",
               at: "top",
               of: window
               , collision: "none"
        },
        width:          "auto",
        minWidth:       400,
        minHeight:      200,
        zIndex:         3666,
        beforeClose:    protectUnsavedChanges
    } )
    .dialog ("widget").draggable ("option", "containment", "window");

    //--- Fix crazy bug in FF! ...
    controlsDialog.parent ().css ( {
        position:   "fixed",
        top:        0,
        left:       "4em",
        width:      "75ex"
    } );

    //--- Use drag and drop to reorder entries.
    $(".gmReasonInpTbl > tbody").sortable ();

    //--- Activate all of the buttons
    controlsDialog.on ("click", ".popup-close > a", function (zEvent) {
        $(this).parents (".gmReasonInpTbl > tbody > tr").remove ();
    } );

    $("#gmAddRow, #gmSaveChanges, #gmCancel").on ("click focus blur mouseenter mouseleave", function (zEvent) {
        var jThis = $(this);
        switch (zEvent.type) {
            case "focus":
            case "mouseenter":
                jThis.css ("color", "yellow");
                if (this.id == "gmAddRow")
                    jThis.addClass ("ui-state-hover");
                break;

            case "blur":
            case "mouseleave":
                jThis.css ("color", "");
                if (this.id == "gmAddRow")
                    jThis.removeClass ("ui-state-hover");
                break;

            case "click":
                switch (this.id) {
                    case "gmAddRow":
                        $(".gmReasonInpTbl > tbody").append ( '                                             \
                            <tr>                                                                            \
                                <td><input type="text" value="" class="gmLabelTxt"></td>                    \
                                <td><input type="text" value="" class="gmReasonTxt"></td>                   \
                                <td><div class="popup-close"><a title="Delete this entry.">×</a></div></td> \
                            </tr>                                                                           \
                        ' );
                        break;
                    case "gmSaveChanges":
                        if (updateReasonsArray () )
                            removeOptionsDialog ();
                        break;
                    case "gmCancel":
                        if (protectUnsavedChanges () )
                            removeOptionsDialog ();
                        break;
                    default:
                        break;
                }
                break;

            default:
                break;
        }
    } );
}

function removeOptionsDialog () {
    var optionsDlg      = $("#gmOverlayDialog");
    if (optionsDlg.dialog ("instance") )
        optionsDlg.dialog ("destroy");
    else
        optionsDlg.remove ();
}

function updateReasonsArray () {
    // Loop through ROWS, discard invalid entries, warn if no valid entries
    // Save using GM_setValue.
    var newReasons      = [];
    $(".gmReasonInpTbl > tbody > tr").each ( function () {
        var reasonEntry = [];
        var vldEntries  = true;
        $(this).find ("input").each ( function () {
            var tVal    = this.value.trim ();
            if (tVal)   reasonEntry.push (tVal);
            else        vldEntries  = false;
        } );
        if (vldEntries)
            newReasons.push (reasonEntry);
    } );

    if (newReasons.length == 0) {
        // No valid entries.
        $(".gmOptionControls > .form-submit").before ( '                                                    \
            <div class="gmError ui-state-error ui-corner-all">                                              \
                <p><span class="ui-icon ui-icon-alert" style="float: left; margin-right: 0.3em;"></span>    \
                There are no valid entries!</p>                                                             \
            </div>                                                                                          \
        ' );

        return false;
    }
    reasonArray         = newReasons. slice (0);

    //--- Now save with GM_set and redraw any open edit controls.
    GM_setValue ("reasonArray", JSON.stringify (reasonArray) );

    $(".gmEditControls").remove ();
    //--- Resets waitForKeyElements history...
    $(".inline-post, .post-form").data ('alreadyFound', false);

    return true;
}

function protectUnsavedChanges (zEvent) {
    var savedChk    = reasonArray.toString ();
    var WIP_Chk     = $(".gmReasonInpTbl input").map ( function () {
        return $(this).val (). trim ();
    } ).get ().toString ().trim ().replace (/[, ]+$/, "");

    if (savedChk == WIP_Chk)
        return true;

    return confirm ("Discard unsaved changes?!");
}

GM_addStyle ( multilineStr ( function () {/*!
    .gmEditControls {
        margin-bottom: 1ex;
        position: relative;
        text-align: left;
    }
    .gmEditControls > label {
        color: black;
        cursor: pointer;
        display: inline-block;
        font-weight: normal;
        line-height: 1.5;
        margin-right: 1em;
        padding: 0 0.3ex;
    }
    .gmEditControls > label:hover {
        background: lightyellow;
    }
    .gmEditControls > label > input {
        margin-right: 0.3ex;
        cursor: pointer;
    }
    .gmEditControls > img {
        position: absolute;
        padding: 0.2ex;
        right: 0;
        top: 0;
        cursor: pointer;
    }
    .gmEditControls > p {
        margin-bottom: 1ex;
    }
    .gmEditControls > img:hover {
        background: lightyellow;
    }
    .gmOptionControls {
        text-align: left;
    }
    .gmReasonInpTbl tr > td {
        padding: 0 3ex 0 0.6ex;
    }
    .gmReasonInpTbl tr > td {
        width: 20%;
    }
    .gmReasonInpTbl tr > td+td {
        width: 50%;
    }
    .gmReasonInpTbl tr > td+td+td {
        width: 9%;
    }
    .gmLabelTxt, .gmReasonTxt {
        width: 100%;
    }
    .gmReasonInpTbl > tbody > tr > td > .popup-close {
        float: left;
    }
    .gmReasonInpTbl > tbody > tr {
        cursor: pointer;
    }
    .gmReasonInpTbl > tbody > tr:nth-child(odd) {
        background-color: #417e13;
    }
    .gmReasonInpTbl > tbody > tr:nth-child(even) {
        background-color: #61A030;
    }
    .popup-close > a:hover {
        color: red !important;
    }
    .popup-close:hover {
        border: 1px outset red;
    }
    .gmOptionControls > .form-submit {
        margin: 2em 0 0 0;
        padding: 0;
    }
    #gmAddRow {
        padding: 0 1ex;
    }
    #gmCancel {
        margin-left: 2em;
    }
    .form-submit input:hover {
        color: yellow;
    }
    .gmError {
        margin: 1ex 0;
        padding: 1ex 1em;
    }
    .gmError > p {
        font-size: 3ex;
        margin: 0;
        color: black;
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
