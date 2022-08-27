var jsnShader = [
    {
        "ver": "0.1",
        "renderpass": [
          {
            "outputs": [
              {
                "channel": 0,
                "id": "4dfGRr"
              }
            ],
            "inputs": [
              {
                "channel": 0,
                "type": "texture",
                "id": "Xsf3zn",
                "filepath": "/shadertoy/cloud-ten/noise.png",
                "sampler": {
                  "filter": "mipmap",
                  "wrap": "repeat",
                  "vflip": "false",
                  "srgb": "false",
                  "internal": "byte"
                }
              }
            ],
            "code": "/*\nThe MIT License (MIT)\n\nCopyright (c) 2015 Huw Bowles & Daniel Zimmermann\n\nPermission is hereby granted, free of charge, to any person obtaining a copy\nof this software and associated documentation files (the \"Software\"), to deal\nin the Software without restriction, including without limitation the rights\nto use, copy, modify, merge, publish, distribute, sublicense, and/or sell\ncopies of the Software, and to permit persons to whom the Software is\nfurnished to do so, subject to the following conditions:\n\nThe above copyright notice and this permission notice shall be included in all\ncopies or substantial portions of the Software.\n\nTHE SOFTWARE IS PROVIDED \"AS IS\", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR\nIMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,\nFITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE\nAUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER\nLIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,\nOUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE\nSOFTWARE.\n*/\n\n// UPDATE: this method is now superseded by a new approach named Structured Sampling,\n// see here: https://www.shadertoy.com/view/Mt3GWs\n//\n// Example to illustrate volume sampling research undertaken right here on\n// shadertoy and published at siggraph 2015:\n//\n// http://advances.realtimerendering.com/s2015/index.html\n//\n// In particular this shader demonstrates Forward Pinning and Adaptive Sampling.\n// The general advection requires state and is not implemented here, see the Unity\n// implementation for this:\n//\n// https://github.com/huwb/volsample\n//\n// For a diagram shader illustrating the adaptive sampling:\n//\n// https://www.shadertoy.com/view/llXSD7\n// \n//\n// Credits - this scene is mostly mash up of these two amazing shaders:\n//\n// Clouds by iq: https://www.shadertoy.com/view/XslGRr\n// Cloud Ten by nimitz: https://www.shadertoy.com/view/XtS3DD\n// \n\n#define SAMPLE_COUNT 32\n#define DIST_MAX 128.\n#define MOUSEY (3.*iMouse.y/iResolution.y)\n#define SAMPLES_ADAPTIVITY 0.2\n\n// mouse toggle\nbool useNewApproach = true;\n\n// cam moving in a straight line\nvec3 lookDir = vec3(-1.,0.,0.);\nvec3 camVel = vec3(-3.,0.,0.);\nfloat zoom = 1.2; // 1.5;\n\n// cam spin around on spot\nfloat samplesCurvature = 0.; // can mix between fixed z and fixed radius sampling\n\nvec3 sundir = normalize(vec3(-1.0,0.0,-1.));\n\n// LUT based 3d value noise\nfloat noise( in vec3 x )\n{\n    vec3 p = floor(x);\n    vec3 f = fract(x);\n    f = f*f*(3.0-2.0*f);\n    \n    vec2 uv = (p.xy+vec2(37.0,17.0)*p.z) + f.xy;\n    vec2 rg = textureLod( iChannel0, (uv+ 0.5)/256.0, 0.0 ).yx;\n    return mix( rg.x, rg.y, f.z );\n}\n\n\nvec4 map( in vec3 p )\n{\n\tfloat d = 0.1 + .8 * sin(0.6*p.z)*sin(0.5*p.x) - p.y;\n\n    vec3 q = p;\n    float f;\n    \n    f  = 0.5000*noise( q ); q = q*2.02;\n    f += 0.2500*noise( q ); q = q*2.03;\n    f += 0.1250*noise( q ); q = q*2.01;\n    f += 0.0625*noise( q );\n    d += 2.75 * f;\n\n    d = clamp( d, 0.0, 1.0 );\n    \n    vec4 res = vec4( d );\n    \n    vec3 col = 1.15 * vec3(1.0,0.95,0.8);\n    col += vec3(1.,0.,0.) * exp2(res.x*10.-10.);\n    res.xyz = mix( col, vec3(0.7,0.7,0.7), res.x );\n    \n    return res;\n}\n\n// compute desired spacing between samples, modelled as a 1/z curve\nfloat spacing(float t )\n{\n    // restrict to domain\n    t = max(t,0.);\n    \n    // unnorm pdf - plot this in graphtoy to see shape\n    float pdf = 1. / (SAMPLES_ADAPTIVITY*t + 1.);\n\t// integral of pdf over dist\n\tfloat norm = (1. / SAMPLES_ADAPTIVITY)*log(1. + SAMPLES_ADAPTIVITY*DIST_MAX);\n    // norm pdf\n    pdf /= norm;\n    \n    // sample spacing for our sample count\n    return 1. / (float(SAMPLE_COUNT) * pdf);\n}\n\n// mod but moves the boundaries to keep them stationary with the camera\nfloat mov_mod( float x, float y )\n{\n    return mod(x + (useNewApproach ? dot(camVel*iTime,lookDir) : 0.), y) ;\n}\n\nbool on_boundary( float x, float y )\n{\n    // the +0.25 solves numerical issues without changing the result\n    float numericalFixOffset = y*0.25;\n    return mov_mod( x + numericalFixOffset, y ) < y*0.5;\n}\n\n// put t on an appropriate sample location and initialise sampling data\nvoid firstT( out float t, out float dt, out float wt, out bool even )\n{\n    dt = exp2(floor(log2(spacing(0.))));\n    t = dt - mov_mod(t,dt);\n    even = on_boundary(t,2.*dt);\n    wt = 1.;\n}\n\n// advance t to next sample location\nvoid nextT( inout float t, inout float dt, inout float wt, inout bool even )\n{\n    float s = spacing(t); // get desired sample spacing\n    if( s < dt ) { dt /= 2.; even = true; } // can immediately move to higher density\n    else if( even && s > 2.*dt ) { dt *= 2.; wt = 1.; even = on_boundary(t,2.*dt); } // move to lower density if a sample is there\n\n    if( even ) wt = clamp( 2. - s/dt,0.,1.); // update wt for next odd sample - based on how far this even sample is into its band\n    \n    // next sample\n    t += dt;\n    even = !even;\n}\n\n// wt for blending in/out samples without pops\nfloat sampleWt( float wt, bool even )\n{\n    return even ? (2.-wt) : wt;\n}\n\nvec4 raymarch( in vec3 ro, in vec3 rd )\n{\n    vec4 sum = vec4(0, 0, 0, 0);\n    \n    // setup sampling\n    float t, dt, wt; bool even;\n    firstT( t, dt, wt, even );\n    \n    for(int i=0; i<SAMPLE_COUNT; i++)\n    {\n        if( sum.a > 0.99 ) continue;\n\n        vec3 pos = ro + t*rd;\n        vec4 col = map( pos );\n        \n        // iqs goodness\n        float dif = clamp((col.w - map(pos+0.6*sundir).w)/0.6, 0.0, 1.0 );\n        vec3 lin = vec3(0.51, 0.53, 0.63)*1.35 + 0.55*vec3(0.85, 0.57, 0.3)*dif;\n        col.xyz *= lin;\n        \n        col.xyz *= col.xyz;\n        \n        col.a *= 0.35;\n        col.rgb *= col.a;\n\n        // fade samples at far field\n        float fadeout = 1.-clamp((t/(DIST_MAX*.3)-.85)/.15,0.,1.); // .3 is an ugly fudge factor due to oversampling\n            \n        // integrate\n        float thisDt = dt * sampleWt( wt, even); // blend in dts\n        thisDt = sqrt(thisDt/5. )*5.; // hack to soften and brighten\n        sum += thisDt * col * (1.0 - sum.a) * fadeout;\n\n        // next sample\n        nextT( t, dt, wt, even );\n    }\n\n    sum.xyz /= (0.001+sum.w);\n\n    return clamp( sum, 0.0, 1.0 );\n}\n\nvec3 sky( vec3 rd )\n{\n    vec3 col = vec3(0.);\n    \n    float hort = 1. - clamp(abs(rd.y), 0., 1.);\n    col += 0.5*vec3(.99,.5,.0)*exp2(hort*8.-8.);\n    col += 0.1*vec3(.5,.9,1.)*exp2(hort*3.-3.);\n    col += 0.55*vec3(.6,.6,.9);\n    \n    float sun = clamp( dot(sundir,rd), 0.0, 1.0 );\n    col += .2*vec3(1.0,0.3,0.2)*pow( sun, 2.0 );\n    col += .5*vec3(1.,.9,.9)*exp2(sun*650.-650.);\n    col += .1*vec3(1.,1.,0.1)*exp2(sun*100.-100.);\n    col += .3*vec3(1.,.7,0.)*exp2(sun*50.-50.);\n    col += .5*vec3(1.,0.3,0.05)*exp2(sun*10.-10.); \n    \n    float ax = atan(rd.y,length(rd.xz))/1.;\n    float ay = atan(rd.z,rd.x)/2.;\n    float st = texture( iChannel0, vec2(ax,ay) ).x;\n    float st2 = texture( iChannel0, .25*vec2(ax,ay) ).x;\n    st *= st2;\n    st = smoothstep(0.65,.9,st);\n    col = mix(col,col+1.8*st,clamp(1.-1.1*length(col),0.,1.));\n    \n    return col;\n}\n\nvoid mainImage( out vec4 fragColor, in vec2 fragCoord )\n{\n    if( iMouse.z > 0. )\n        useNewApproach = false;\n    \n    vec2 q = fragCoord.xy / iResolution.xy;\n    vec2 p = -1.0 + 2.0*q;\n    p.x *= iResolution.x/ iResolution.y;\n    vec2 mo = -1.0 + 2.0*iMouse.xy / iResolution.xy;\n   \n    // camera\n    vec3 ro = vec3(0.,1.9,0.) + iTime*camVel;\n    vec3 ta = ro + lookDir; //vec3(ro.x, ro.y, ro.z-1.);\n    vec3 ww = normalize( ta - ro);\n    vec3 uu = normalize(cross( vec3(0.0,1.0,0.0), ww ));\n    vec3 vv = normalize(cross(ww,uu));\n    vec3 rd = normalize( p.x*uu + 1.2*p.y*vv + 1.5*ww );\n    \n    // sky\n    vec3 col = sky(rd);\n    \n    // divide by forward component to get fixed z layout instead of fixed dist layout\n    vec3 rd_layout = rd/mix(dot(rd,ww),1.0,samplesCurvature);\n    vec4 clouds = raymarch( ro, rd_layout );\n    \n    col = mix( col, clouds.xyz, clouds.w );\n    \n\tcol = clamp(col, 0., 1.);\n    col = smoothstep(0.,1.,col);\n\tcol *= pow( 16.0*q.x*q.y*(1.0-q.x)*(1.0-q.y), 0.12 ); //Vign\n        \n    fragColor = vec4( col, 1.0 );\n}\n",
            "name": "Image",
            "description": "",
            "type": "image"
          }
        ],
        "flags": {
          "mFlagVR": false,
          "mFlagWebcam": false,
          "mFlagSoundInput": false,
          "mFlagSoundOutput": false,
          "mFlagKeyboard": false,
          "mFlagMultipass": false,
          "mFlagMusicStream": false
        },
        "info": {
          "id": "XdfXzn",
          "date": "1395576140",
          "viewed": 9145,
          "name": "Sample Pinning",
          "username": "huwb",
          "description": "Mash up of Clouds by iq and Cloud Ten by nimitz to demonstrate sample pinning & adaptive sampling algorithms presented at siggraph 2015: http://advances.realtimerendering.com/s2015/index.html",
          "likes": 127,
          "published": 1,
          "flags": 0,
          "usePreview": 1,
          "tags": [
            "noise",
            "raymarch",
            "clouds",
            "sampling",
            "stationary"
          ],
          "hasliked": 1,
          "parentid": "",
          "parentname": ""
        }
      }
];

compileAndStart(jsnShader);