var gShaderToy = null;

function ShaderToy() {
    this.mAudioContext = null;
    this.mCreated = false;
    this.mHttpReq = null;
    this.mEffect = null;
    this.mTo = null;
    this.mTOffset = 0;
    this.mCanvas = c; //id of canvas element on page
    this.mFpsFrame = 0;
    this.mFpsTo = null;
    this.mIsPaused = false;
    this.mForceFrame = true;
    this.mInfo = null;
    this.mCode = null;

    var me = this;

    this.mHttpReq = new XMLHttpRequest();
    this.mTo = new Date().getTime();
    this.mTf = this.mTOffset;
    this.mFpsTo = this.mTo;
    this.mMouseIsDown = false;
    this.mMouseOriX = 0;
    this.mMouseOriY = 0;
    this.mMousePosX = 0;
    this.mMousePosY = 0;

    // --- audio context ---------------------

    this.mAudioContext = piCreateAudioContext();

    var resizeCB = function (xres, yres) {
    me.mForceFrame = true;
    };
    var crashCB = function () {};
    this.mEffect = new Effect(
    null,
    this.mAudioContext,
    this.mCanvas,
    this.RefreshTexturThumbail,
    this,
    true,
    false,
    resizeCB,
    crashCB
    );
    

    this.mCanvas.onmousedown = function(ev)
    {
        var rect = me.mCanvas.getBoundingClientRect();
        me.mMouseOriX = Math.floor((ev.clientX-rect.left)/(rect.right-rect.left)*me.mCanvas.width);
        me.mMouseOriY = Math.floor(me.mCanvas.height - (ev.clientY-rect.top)/(rect.bottom-rect.top)*me.mCanvas.height);
        me.mMousePosX = me.mMouseOriX;
        me.mMousePosY = me.mMouseOriY;
        me.mMouseIsDown = true;
		me.mMouseSignalDown = true;
        if( me.mIsPaused ) me.mForceFrame = true;
//        return false; // prevent mouse pointer change
    }
    this.mCanvas.onmousemove = function(ev)
    {
        if( me.mMouseIsDown )
        {
            var rect = me.mCanvas.getBoundingClientRect();
            me.mMousePosX = Math.floor((ev.clientX-rect.left)/(rect.right-rect.left)*me.mCanvas.width);
            me.mMousePosY = Math.floor(me.mCanvas.height - (ev.clientY-rect.top)/(rect.bottom-rect.top)*me.mCanvas.height);
            if( me.mIsPaused ) me.mForceFrame = true;
        }
    }
    this.mCanvas.onmouseup = function(ev)
    {
        me.mMouseIsDown = false;
        if( me.mIsPaused ) me.mForceFrame = true;
    }

    this.mCanvas.addEventListener("keydown",function(ev)
    {
        me.mEffect.SetKeyDown( me.mActiveDoc, ev.keyCode );
        if( me.mIsPaused ) me.mForceFrame = true;
        ev.preventDefault();
    },false);

    this.mCanvas.addEventListener("keyup",function(ev)
    {
        me.mEffect.SetKeyUp( me.mActiveDoc, ev.keyCode );
        if( me.mIsPaused ) me.mForceFrame = true;
        ev.preventDefault();
    },false);

    this.mCreated = true;
}

ShaderToy.prototype.startRendering = function () {
    var me = this;

    function renderLoop2() {
    setTimeout(renderLoop2, 1000 / 60);

    if (me.mIsPaused && !me.mForceFrame) {
        me.mEffect.UpdateInputs(0, false);
        return;
    }

    me.mForceFrame = false;
    var time = new Date().getTime();
    var ltime = me.mTOffset + time - me.mTo;

    if (me.mIsPaused) ltime = me.mTf;
    else me.mTf = ltime;

    var dtime = 1000.0 / 60.0;

    me.mEffect.Paint(
        ltime / 1000.0,
        dtime / 1000.0,
        60,
        me.mMouseOriX,
        me.mMouseOriY,
        me.mMousePosX,
        me.mMousePosY,
        me.mIsPaused
    );

    me.mFpsFrame++;

    if (time - me.mFpsTo > 1000) {
        var ffps = (1000.0 * me.mFpsFrame) / (time - me.mFpsTo);
        me.mFpsFrame = 0;
        me.mFpsTo = time;
    }
    }

    renderLoop2();
};

//---------------------------------

ShaderToy.prototype.Stop = function () {
    this.mIsPaused = true;
    this.mEffect.StopOutputs();
};

ShaderToy.prototype.pauseTime = function () {
    var time = new Date().getTime();
    if (!this.mIsPaused) {
    this.Stop();
    } else {
    this.mTOffset = this.mTf;
    this.mTo = time;
    this.mIsPaused = false;
    this.mEffect.ResumeOutputs();
    }
};

ShaderToy.prototype.resetTime = function () {
    this.mTOffset = 0;
    this.mTo = new Date().getTime();
    this.mTf = 0;
    this.mFpsTo = this.mTo;
    this.mFpsFrame = 0;
    this.mForceFrame = true;
    this.mEffect.ResetTime();
};

ShaderToy.prototype.PauseInput = function (id) {
    return this.mEffect.PauseInput(0, id);
};

ShaderToy.prototype.MuteInput = function (id) {
    return this.mEffect.MuteInput(0, id);
};

ShaderToy.prototype.RewindInput = function (id) {
    this.mEffect.RewindInput(0, id);
};

ShaderToy.prototype.SetTexture = function (slot, url) {
    this.mEffect.NewTexture(0, slot, url);
};

ShaderToy.prototype.RefreshTexturThumbail = function (
    myself,
    slot,
    img,
    forceFrame,
    gui,
    guiID,
    time
) {
    myself.mForceFrame = forceFrame;
};

ShaderToy.prototype.GetTotalCompilationTime = function () {
    return this.mEffect.GetTotalCompilationTime();
};

ShaderToy.prototype.Load = function (jsn) {
    try {
    var res = this.mEffect.Load(jsn, false);
    this.mCode = res.mShader;

    if (res.mFailed === false) {
        this.mForceFrame = true;
    }

    this.mInfo = jsn.info;

    return {
        mFailed: false,
        mDate: jsn.info.date,
        mViewed: jsn.info.viewed,
        mName: jsn.info.name,
        mUserName: jsn.info.username,
        mDescription: jsn.info.description,
        mLikes: jsn.info.likes,
        mPublished: jsn.info.published,
        mHasLiked: jsn.info.hasliked,
        mTags: jsn.info.tags,
    };
    } catch (e) {
    return { mFailed: true };
    }
};

ShaderToy.prototype.Compile = function (onResolve) {
    this.mEffect.Compile(true, onResolve);
};
  
function compileAndStart(jsnShader) {
    gShaderToy = new ShaderToy();

    var gRes = gShaderToy.Load(jsnShader[0]);
    if (gRes.mFailed) {
    gShaderToy.pauseTime();
    gShaderToy.resetTime();
    } else {
    gShaderToy.Compile(function (worked) {
        if (!worked) return;

        if (gShaderToy.mIsPaused) {
        gShaderToy.Stop();
        }

        gShaderToy.startRendering();
    });
    }
}