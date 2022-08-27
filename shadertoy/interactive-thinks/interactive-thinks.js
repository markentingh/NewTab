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
                "filepath": "/media/a/f735bee5b64ef98879dc618b016ecf7939a5756040c2cde21ccb15e69a6e1cfb.png",
                "sampler": {
                  "filter": "mipmap",
                  "wrap": "repeat",
                  "vflip": "false",
                  "srgb": "false",
                  "internal": "byte"
                }
              },
              {
                "channel": 1,
                "type": "buffer",
                "id": "4dXGR8",
                "filepath": "/media/previz/buffer00.png",
                "sampler": {
                  "filter": "linear",
                  "wrap": "clamp",
                  "vflip": "true",
                  "srgb": "false",
                  "internal": "byte"
                }
              }
            ],
            "code": "// Created by sebastien durand - 11/2016\n//-------------------------------------------------------------------------------------\n// Based on \"Type 2 Supernova\" by Duke (https://www.shadertoy.com/view/lsyXDK) \n// Sliders from IcePrimitives by Bers (https://www.shadertoy.com/view/MscXzn)\n// License: Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License\n//-------------------------------------------------------------------------------------\n\n#define SPIRAL_NOISE_ITER 8\n//#define SHANE_ORGANIC  // from: https://www.shadertoy.com/view/MsjBDR\n\nfloat hash( const in vec3 p ) {\n    return fract(sin(dot(p,vec3(127.1,311.7,758.5453123)))*43758.5453123);\n}\n\nfloat pn(in vec3 x) {\n    vec3 p = floor(x), f = fract(x);\n\tf *= f*(3.-f-f);\n\tvec2 uv = (p.xy+vec2(37,17)*p.z) + f.xy,\n\t     rg = textureLod( iChannel0, (uv+.5)/256., -100.).yx;\n\treturn 2.4*mix(rg.x, rg.y, f.z)-1.;\n}\n\n//-------------------------------------------------------------------------------------\n// otaviogood's noise from https://www.shadertoy.com/view/ld2SzK\n//--------------------------------------------------------------\n// This spiral noise works by successively adding and rotating sin waves while increasing frequency.\n// It should work the same on all computers since it's not based on a hash function like some other noises.\n// It can be much faster than other noise functions if you're ok with some repetition.\nconst float nudge = 20.;\t// size of perpendicular vector\nfloat normalizer = 1.0 / sqrt(1.0 + nudge*nudge);\t// pythagorean theorem on that perpendicular to maintain scale\nfloat SpiralNoiseC(vec3 p, vec4 id) {\n    float iter = 2., n = 2.-id.x; // noise amount\n    for (int i = 0; i < SPIRAL_NOISE_ITER; i++) {\n        // add sin and cos scaled inverse with the frequency\n        n += -abs(sin(p.y*iter) + cos(p.x*iter)) / iter;\t// abs for a ridged look\n        // rotate by adding perpendicular and scaling down\n        p.xy += vec2(p.y, -p.x) * nudge;\n        p.xy *= normalizer;\n        // rotate on other axis\n        p.xz += vec2(p.z, -p.x) * nudge;\n        p.xz *= normalizer;  \n        // increase the frequency\n        iter *= id.y + .733733;\n    }\n    return n;\n}\n\n#ifdef SHANE_ORGANIC\nfloat map(vec3 p, vec4 id) {\n    float k = 2.*id.w +.1;  // p/=k;\n    p *=(.5+4.*id.y);\n    return k*(.1+abs(dot(p = cos(p*.6 + sin(p.zxy*1.8)), p) - 1.1)*3. + pn(p*4.5)*.12);\n}\n#else\nfloat map(vec3 p, vec4 id) {\n\tfloat k = 2.*id.w +.1; //  p/=k;\n    return k*(.5 + SpiralNoiseC(p.zxy*.4132+333., id)*3. + pn(p*8.5)*.12);\n}\n#endif\n\n//-------------------------------------------------------------------------------------\n// Based on [iq: https://www.shadertoy.com/view/MsS3Wc]\n//-------------------------------------------------------------------------------------\nvec3 hsv2rgb(float x, float y, float z) {\t\n\treturn z+z*y*(clamp(abs(mod(x*6.+vec3(0,4,2),6.)-3.)-1.,0.,1.)-1.);\n}\n\n//-------------------------------------------------------------------------------------\n// Based on \"Type 2 Supernova\" by Duke (https://www.shadertoy.com/view/lsyXDK) \n//-------------------------------------------------------------------------------------\nvec4 renderSuperstructure(vec3 ro, vec3 rd, const vec4 id) {\n    const float max_dist=20.;\n\tfloat ld, td=0., w, d, t, noi, lDist, a,         \n    \t  rRef = 2.*id.x,\n          h = .05+.25*id.z;\n   \n    vec3 pos, lightColor;   \n    vec4 sum = vec4(0);\n   \t\n    t = .3*hash(vec3(hash(rd))+iTime); \n\n    for (int i=0; i<200; i++)  {\n\t\t// Loop break conditions.\n\t    if(td>.9 ||  sum.a > .99 || t>max_dist) break;\n        \n        // Color attenuation according to distance\n        a = smoothstep(max_dist,0.,t);\n        \n        // Evaluate distance function\n        d = abs(map(pos = ro + t*rd, id))+.07;\n        \n        // Light calculations \n        lDist = max(length(mod(pos+2.5,5.)-2.5), .001); // TODO add random offset\n        noi = pn(0.03*pos);\n        lightColor = mix(hsv2rgb(noi,.5,.6), \n                         hsv2rgb(noi+.3,.5,.6), \n                         smoothstep(rRef*.5,rRef*2.,lDist));\n        sum.rgb += a*lightColor/exp(lDist*lDist*lDist*.08)/30.;\n\t\t\n        if (d<h) {\n\t\t\ttd += (1.-td)*(h-d)+.005;  // accumulate density\n            sum.rgb += sum.a * sum.rgb * .25 / lDist;  // emission\t\n\t\t\tsum += (1.-sum.a)*.05*td*a;  // uniform scale density + alpha blend in contribution \n        } \n\t\t\n        td += .015;\n        t += max(d * .08 * max(min(lDist,d),2.), .01);  // trying to optimize step size\n    }\n    \n    // simple scattering\n    sum *= 1. / exp(ld*.2)*.9;\n   \tsum = clamp(sum, 0., 1.);   \n    sum.xyz *= sum.xyz*(3.-sum.xyz-sum.xyz);\n\treturn sum;\n}\n\n// ---------------------------------------------------\n// Bers : https://www.shadertoy.com/view/MscXzn\n// ---------------------------------------------------\nvec4 processSliders(in vec2 uv, out vec4 sliderVal) {\n    sliderVal = textureLod(iChannel1,vec2(0),0.0);\n    if(length(uv.xy)>1.) {\n    \treturn textureLod(iChannel1,uv.xy/iResolution.xy,0.0);\n    }\n    return vec4(0);\n}\n\n#define R(p, a) p=cos(a)*p+sin(a)*vec2(p.y, -p.x)\n\nvoid mainImage( out vec4 fragColor, in vec2 fragCoord )\n{   \n    vec4 sliderVal, cSlider = processSliders(fragCoord, sliderVal);\n    vec2 m = iMouse.xy/iResolution.xy;\n    vec3 ro = vec3(15.+iTime, cos(.1*iTime), 15.+iTime),\n\t\t rd = normalize(vec3((fragCoord.xy-0.5*iResolution.xy)/iResolution.y, 1.));\n   \n    R(rd.zx, 3.*m.x);\n    R(rd.yx, 1.5*m.y);\n    R(rd.xz, iTime*.1);\n\t   \n    // Super Structure\n\tvec4 col = renderSuperstructure(ro, rd, sliderVal);\n\n    //Apply slider overlay\n    fragColor = col;\n}\n",
            "name": "Image",
            "description": "",
            "type": "image"
          },
          {
            "outputs": [
              {
                "channel": 0,
                "id": "4dXGR8"
              }
            ],
            "inputs": [
              {
                "channel": 0,
                "type": "buffer",
                "id": "4dXGR8",
                "filepath": "/media/previz/buffer00.png",
                "sampler": {
                  "filter": "linear",
                  "wrap": "clamp",
                  "vflip": "true",
                  "srgb": "false",
                  "internal": "byte"
                }
              }
            ],
            "code": "//Buffer A : slider management (this is not required)\n// Bers : https://www.shadertoy.com/view/MscXzn\n\n#define saturate(x) clamp(x,0.0,1.0)\n\nvec4 sliderVal = vec4(0.5,0.4,0.2,0.4); //Default slider values [0-1]\n\n// vec4 sliderVal = vec4(0.4,0.4,0.,0.5); // bras de galaxies\n// vec4 sliderVal = vec4(1.,0.2,0.,0.1); // bacteries\n\n\nvoid SLIDER_setValue(float idx, float val)\n{\n    if(idx<0.) return;\n    else if(idx<0.25) sliderVal[0] = saturate(val);\n\telse if(idx<0.50) sliderVal[1] = saturate(val);\n\telse if(idx<0.75) sliderVal[2] = saturate(val);\n\telse if(idx<1.00) sliderVal[3] = saturate(val);\n}\n\nfloat SLIDER_getValue(float idx)\n{\n    if     (idx<0.25) return sliderVal[0];\n    else if(idx<0.50) return sliderVal[1];\n    else if(idx<0.75) return sliderVal[2];\n    else if(idx<1.00) return sliderVal[3];\n\telse return 0.;\n}\n\nvoid SLIDER_init(vec2 mousePos, vec2 cMin, vec2 cMax )\n{\n    vec4 cPingPong = textureLod(iChannel0,vec2(0),0.0);\n    if(length(cPingPong)>0.001)\n        sliderVal = cPingPong;\n        \n    float width = cMax.x-cMin.x;\n    float height = cMax.y-cMin.y;\n    if(mousePos.x>cMin.x && mousePos.x<cMax.x &&\n       mousePos.y>cMin.y && mousePos.y<cMax.y )\n    {\n        float t = (mousePos.y-cMin.y)/height;\n        t = clamp(t/0.75-0.125,0.,1.); //25% top/bottom margins\n\t\tSLIDER_setValue((mousePos.x-cMin.x)/width, t);\n    }\n}\n\n//Returns the distance from point \"p\" to a given line segment defined by 2 points [a,b]\nfloat UTIL_distanceToLineSeg(vec2 p, vec2 a, vec2 b)\n{\n    //       p\n    //      /\n    //     /\n    //    a--e-------b\n    vec2 ap = p-a;\n    vec2 ab = b-a;\n    //Scalar projection of ap in the ab direction = dot(ap,ab)/|ab| : Amount of ap aligned towards ab\n    //Divided by |ab| again, it becomes normalized along ab length : dot(ap,ab)/(|ab||ab|) = dot(ap,ab)/dot(ab,ab)\n    //The clamp provides the line seg limits. e is therefore the \"capped orthogogal projection\", and length(p-e) is dist.\n    vec2 e = a+clamp(dot(ap,ab)/dot(ab,ab),0.0,1.0)*ab;\n    return length(p-e);\n}\n\n//uv = slider pixel in local space [0-1], t = slider value [0-1], ar = aspect ratio (w/h)\nvec4 SLIDER_drawSingle(vec2 uv, float t, vec2 ar, bool bHighlighted)\n{\n    const vec3  ITEM_COLOR = vec3(1);\n    const vec3  HIGHLIGHT_COLOR = vec3(0.2,0.7,0.8);\n    const float RAD = 0.05;  //Cursor radius, in local space\n    const float LW  = 0.030; //Line width\n    float aa  = 14./iResolution.x; //antialiasing width (smooth transition)\n    vec3 selectionColor = bHighlighted?HIGHLIGHT_COLOR:ITEM_COLOR;\n    vec3 cheapGloss   = 0.8*selectionColor+0.2*smoothstep(-aa,aa,uv.y-t-0.01+0.01*sin(uv.x*12.));\n    vec2 bottomCenter = vec2(0.5,0.0);\n\tvec2 topCenter    = vec2(0.5,1.0);\n    vec2 cursorPos    = vec2(0.5,t);\n    float distBar = UTIL_distanceToLineSeg(uv*ar, bottomCenter*ar, topCenter*ar);\n    float distCur = length((uv-cursorPos)*ar)-RAD;\n    float alphaBar = 1.0-smoothstep(2.0*LW-aa,2.0*LW+aa, distBar);\n    float alphaCur = 1.0-smoothstep(2.0*LW-aa,2.0*LW+aa, distCur);\n    vec4  colorBar = vec4(mix(   vec3(1),vec3(0),smoothstep(LW-aa,LW+aa, distBar)),alphaBar);\n    vec4  colorCur = vec4(mix(cheapGloss,vec3(0),smoothstep(LW-aa,LW+aa, distCur)),alphaCur);\n    return mix(colorBar,colorCur,colorCur.a);\n}\n\n#define withinUnitRect(a) (a.x>=0. && a.x<=1. && a.y>=0. && a.y<=1.0)\nvec4 SLIDER_drawAll(vec2 uv, vec2 cMin, vec2 cMax, vec2 muv)\n{\n    float width = cMax.x-cMin.x;\n    float height = cMax.y-cMin.y;\n    vec2 ar = vec2(0.30,1.0);\n    uv  = (uv -cMin)/vec2(width,height); //pixel Normalization\n    muv = (muv-cMin)/vec2(width,height); //mouse Normalization\n    if( withinUnitRect(uv))\n    {\n        float t = SLIDER_getValue(uv.x);\n\t\tbool bHighlight = withinUnitRect(muv) && abs(floor(uv.x*4.0)-floor(muv.x*4.0))<0.01;\n\t\tuv.x = fract(uv.x*4.0); //repeat 4x\n\t\tuv.y = uv.y/0.75-0.125; //25% margins\n        return SLIDER_drawSingle(vec2(uv.x*2.-.5, uv.y),t,ar,bHighlight);\n    }\n    return vec4(0);\n}\n\nvoid mainImage( out vec4 fragColor, in vec2 fragCoord )\n{\n    vec2 cMinSliders = vec2(0.8,0.80);\n    vec2 cMaxSliders = vec2(1.0,1.0);\n    vec2 uvSliders = fragCoord.xy / iResolution.xy;\n\n    vec2 mousePos = iMouse.xy / iResolution.xy;\n    SLIDER_init(mousePos, cMinSliders, cMaxSliders);\n    \n    if(length(fragCoord.xy-vec2(0,0))<1.) \n         fragColor = sliderVal;\n    else {\n\t\tif (!withinUnitRect(uvSliders)) \n            discard;    \n    \tfragColor = SLIDER_drawAll(uvSliders,cMinSliders, cMaxSliders, mousePos);\n\t}\n}\n",
            "name": "Buffer A",
            "description": "",
            "type": "buffer"
          }
        ],
        "flags": {
          "mFlagVR": false,
          "mFlagWebcam": false,
          "mFlagSoundInput": false,
          "mFlagSoundOutput": false,
          "mFlagKeyboard": false,
          "mFlagMultipass": true,
          "mFlagMusicStream": false
        },
        "info": {
          "id": "Xt3SR4",
          "date": "1478358517",
          "viewed": 6328,
          "name": "Interactive thinks",
          "username": "iapafoto",
          "description": "some nice effects inspired by Duke amazing shaders. \n[Sliders] Explore lots of possibles effects\n[Mouse] control rotation",
          "likes": 292,
          "published": 1,
          "flags": 32,
          "usePreview": 1,
          "tags": [
            "noise",
            "interactive",
            "cloud"
          ],
          "hasliked": 1,
          "parentid": "",
          "parentname": ""
        }
      }
];

compileAndStart(jsnShader);