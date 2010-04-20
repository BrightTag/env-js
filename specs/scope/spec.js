
QUnit.module('scope');


test("Basic window object/global scope identity", function(){

    fred = "This is a known string with a sentence in it.";
    ok( window.fred === fred, 'Global variables appear as window members' );
    delete window.fred;

    window.barney = "This is another known string.";
    ok( window.barney === barney, 'Window members appear as global variables' );
    delete window.barney;

    ok( Math, 'Standard JavaScript language built-in objects are globals' );
    ok( window.Math, 'JS language built-ins also appear as window members' );

    // defined in specs/fixtures/define-some-variables.js, loaded in index.html
    ok( aGlobalVariable == "is aGlobalVariable",
        'global variables defined in external files visible' );
    ok( window.aGlobalVariable == "is aGlobalVariable",
        'global variables defined in external files are window members' );
    ok( aTopLevelVarVariable == "is aTopLevelVarVariable",
        '"var" variables defined in external files visible' );
    ok( window.aTopLevelVarVariable == "is aTopLevelVarVariable",
        '"var" variables defined in external files are window members' );
});


asyncTest("Basic iframe behaviors", function(){
    var adjustExpect = runningUnderEnvjs() ? 0 : -3;
/* should be this
    expect( 8+8+8 + 0 + adjustExpect );
 * but asserts commented out in ok_accessToIFrame1x() mean we do this for now:
*/  expect( 7+7+7 + 0 + adjustExpect );


        // check for things loaded directly by index.html
    // iframe1a.html loaded via src= attribute when index.html was parsed
    var iframe = document.getElementById('loaded-iframe');
    ok_accessToIFrame1x(iframe, contentOfIFrameA,
        'iframe loads with page load');


        // for dynamically-loaded iframes, we need to use QUnit's
        // async testing features
    // test dynamic loading of an empty iframe
    var emptyIFrame = document.getElementById('empty-iframe');
    emptyIFrame.onload = function(){
        ok_accessToIFrame1x(emptyIFrame, contentOfIFrameA,
            'empty iframe loads on .src=');
    };
    emptyIFrame.src = "../fixtures/scope/iframe1a.html";

    // test dynamic reloading of an already-populated iframe
    iframe.onload = function(){
        ok_accessToIFrame1x(iframe, contentOfIFrameB,
            'iframe reloads on .src=');
    }
    iframe.src = "../fixtures/scope/iframe1b.html";

    setTimeout(function(){
        start();
    }, 300);     // short should be fine as long as tests are always
                 // run via "file:" or from a web server on same host
});

// iframe1a and iframe1b are identical in structure (so we can use the
//   same assertions against both), but different in content text (so
//   that we can tell which one is currently loaded).  So, create an
//   object (associative array) that is specific to the content of each.
contentOfIFrameA = {
    urlRE : /scope.iframe1a.html$/,
    titleRE : /IFRAME/,
    elementId : 'anElementWithText',
    elementRE : /content of a paragraph/
};
contentOfIFrameB = {
    urlRE : /scope.iframe1b.html$/,
    titleRE : /iframe1b.html/,
    elementId : 'anotherElementWithText',
    elementRE : /block-quote element/
};


// add 7-or-8 to your expect() call's argument for each call to this function
function ok_accessToIFrame1x(iframe, contentOf, message){
    ok( iframe.src.match(contentOf.urlRE),
        message + ": Initial iframe src matches test page source" );

    var idoc = iframe.contentDocument;
    ok( idoc, message + ": Can get 'document' object from test iframe" );
    ok( idoc.title.match(contentOf.titleRE),
        message + ": iframe's title is correct" );

    var para = idoc.getElementById(contentOf.elementId);
    ok( para, message + ": can get paragraph by ID" );
    ok( para.innerHTML.match(contentOf.elementRE),
        message + ": iframe's conent is correct" );


    if (window.top.allTestsAreBeingRunWithinAnExtraIFrame)
        equals( iframe.contentWindow.top, window.parent, message +
            ": '.top' from iframe does point to top window" );
    else
        equals( iframe.contentWindow.top, window, message +
            ": '.top' from iframe does point to top window" );


    // document.parentWindow is IE-specific extension implemented by env.js
    if (runningUnderEnvjs()){
        equals( idoc.parentWindow, iframe.contentWindow, message +
            ": iframe doc's .parentWindow points to iframe's .contentWindow");
/* re-enable this once the preceding passes
        equals( idoc.parentWindow.parent, window, message +
            ": Can follow chain from iframe's doc to containing window");
*/
    }
}


asyncTest("Iframe nesting", function(){
    var startingDepth = 3;
    var endingDepth   = 7;

    expect(4);
// + (10*((endingDepth - startingDepth)+1)));

    window.numberNestedIframeLoads = 2;
    window.windowLoadCount = 0;

    var topNestingIFrame = document.getElementById('nesting-iframe');
    topNestingIFrame.onload = function(){
// iframe2.html contains a static <iframe> element that loads iframe3.html,
// now we should have both loaded, with the structure that
//     index.html --contains--> iframe2.html --contains--> iframe3.html
// w/ id's =     nesting-iframe              nested1Level

        // verify we have as described above
        ok( topNestingIFrame.contentDocument.title.match(/nested-IFRAME/),
            "top-level IFRAME loaded from correct source" );
        var iframeNested1 = topNestingIFrame.contentDocument.
            getElementById('nested1Level');
        ok( iframeNested1.contentDocument.title.match(/IFRAME loading/),
            "can access content of one IFRAME nested in another" );
        equals( iframeNested1.contentWindow.parent.parent, window,
            "can follow 'parent' path from nested IFRAME to root window");
        equals( iframeNested1.contentWindow.top, window,
            "nested IFRAME has correct .top");

        // now, we'll programatically extend the nesting depth from 2 to many
        recursivelyInsertIFrames(startingDepth, endingDepth, iframeNested1);
    };
    topNestingIFrame.src = "../fixtures/scope/iframe2.html";

    setTimeout(function(){
        start();
    }, 1000);
});


function recursivelyInsertIFrames(depth, finalDepth, existingIframe){
    var newIframe;
    newIframe = existingIframe.contentDocument.createElement("iframe");
    newIframe.setAttribute("id", "iframe_of_depth_" + depth);
    newIframe.setAttribute("style", "border: 3px solid blue; padding: 1em; " +
        "width: 95%; height: " + (1100-(140*depth)) + "px;");
    newIframe.src = "/env-js/specs/fixtures/scope/iframe" + (depth+1) + ".html";

    if (depth < finalDepth)
        newIframe.onload = function(){
            recursivelyInsertIFrames(depth+1, finalDepth, newIframe);
        };

    existingIframe.contentDocument.getElementsByTagName('body')[0].
        appendChild(newIframe);
}
