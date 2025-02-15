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
                "type": "musicstream",
                "id": "4dsSRX",
                "filepath": "https://soundcloud.com/zefora/cheyah",
                "sampler": {
                  "filter": "linear",
                  "wrap": "clamp",
                  "vflip": "true",
                  "srgb": "false",
                  "internal": "byte"
                }
              }
            ],
            "code": "// \"The Drive Home\" by Martijn Steinrucken aka BigWings - 2017\n// License Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License.\n// Email:countfrolic@gmail.com Twitter:@The_ArtOfCode\n//\n// I was looking for something 3d, that can be made just with a point-line distance function.\n// Then I saw the cover graphic of the song I'm using here on soundcloud, which is a bokeh traffic\n// shot which is a perfect for for what I was looking for.\n//\n// It took me a while to get to a satisfying rain effect. Most other people use a render buffer for\n// this so that is how I started. In the end though, I got a better effect without. Uncomment the\n// DROP_DEBUG define to get a better idea of what is going on.\n//\n// If you are watching this on a weaker device, you can uncomment the HIGH_QUALITY define\n//\n// Music:\n// Mr. Bill - Cheyah (Zefora's digital rain remix) \n// https://soundcloud.com/zefora/cheyah\n//\n// Video can be found here:\n// https://www.youtube.com/watch?v=WrxZ4AZPdOQ\n//\n// Making of tutorial:\n// https://www.youtube.com/watch?v=eKtsY7hYTPg\n//\n\n#define S(x, y, z) smoothstep(x, y, z)\n#define B(a, b, edge, t) S(a-edge, a+edge, t)*S(b+edge, b-edge, t)\n#define sat(x) clamp(x,0.,1.)\n\n#define streetLightCol vec3(1., .7, .3)\n#define headLightCol vec3(.8, .8, 1.)\n#define tailLightCol vec3(1., .1, .1)\n\n#define HIGH_QUALITY\n#define CAM_SHAKE 1.\n#define LANE_BIAS .5\n#define RAIN\n//#define DROP_DEBUG\n\nvec3 ro, rd;\n\nfloat N(float t) {\n\treturn fract(sin(t*10234.324)*123423.23512);\n}\nvec3 N31(float p) {\n    //  3 out, 1 in... DAVE HOSKINS\n   vec3 p3 = fract(vec3(p) * vec3(.1031,.11369,.13787));\n   p3 += dot(p3, p3.yzx + 19.19);\n   return fract(vec3((p3.x + p3.y)*p3.z, (p3.x+p3.z)*p3.y, (p3.y+p3.z)*p3.x));\n}\nfloat N2(vec2 p)\n{\t// Dave Hoskins - https://www.shadertoy.com/view/4djSRW\n\tvec3 p3  = fract(vec3(p.xyx) * vec3(443.897, 441.423, 437.195));\n    p3 += dot(p3, p3.yzx + 19.19);\n    return fract((p3.x + p3.y) * p3.z);\n}\n\n\nfloat DistLine(vec3 ro, vec3 rd, vec3 p) {\n\treturn length(cross(p-ro, rd));\n}\n \nvec3 ClosestPoint(vec3 ro, vec3 rd, vec3 p) {\n    // returns the closest point on ray r to point p\n    return ro + max(0., dot(p-ro, rd))*rd;\n}\n\nfloat Remap(float a, float b, float c, float d, float t) {\n\treturn ((t-a)/(b-a))*(d-c)+c;\n}\n\nfloat BokehMask(vec3 ro, vec3 rd, vec3 p, float size, float blur) {\n\tfloat d = DistLine(ro, rd, p);\n    float m = S(size, size*(1.-blur), d);\n    \n    #ifdef HIGH_QUALITY\n    m *= mix(.7, 1., S(.8*size, size, d));\n    #endif\n    \n    return m;\n}\n\n\n\nfloat SawTooth(float t) {\n    return cos(t+cos(t))+sin(2.*t)*.2+sin(4.*t)*.02;\n}\n\nfloat DeltaSawTooth(float t) {\n    return 0.4*cos(2.*t)+0.08*cos(4.*t) - (1.-sin(t))*sin(t+cos(t));\n}  \n\nvec2 GetDrops(vec2 uv, float seed, float m) {\n    \n    float t = iTime+m*30.;\n    vec2 o = vec2(0.);\n    \n    #ifndef DROP_DEBUG\n    uv.y += t*.05;\n    #endif\n    \n    uv *= vec2(10., 2.5)*2.;\n    vec2 id = floor(uv);\n    vec3 n = N31(id.x + (id.y+seed)*546.3524);\n    vec2 bd = fract(uv);\n    \n    vec2 uv2 = bd;\n    \n    bd -= .5;\n    \n    bd.y*=4.;\n    \n    bd.x += (n.x-.5)*.6;\n    \n    t += n.z * 6.28;\n    float slide = SawTooth(t);\n    \n    float ts = 1.5;\n    vec2 trailPos = vec2(bd.x*ts, (fract(bd.y*ts*2.-t*2.)-.5)*.5);\n    \n    bd.y += slide*2.;\t\t\t\t\t\t\t\t// make drops slide down\n    \n    #ifdef HIGH_QUALITY\n    float dropShape = bd.x*bd.x;\n    dropShape *= DeltaSawTooth(t);\n    bd.y += dropShape;\t\t\t\t\t\t\t\t// change shape of drop when it is falling\n    #endif\n    \n    float d = length(bd);\t\t\t\t\t\t\t// distance to main drop\n    \n    float trailMask = S(-.2, .2, bd.y);\t\t\t\t// mask out drops that are below the main\n    trailMask *= bd.y;\t\t\t\t\t\t\t\t// fade dropsize\n    float td = length(trailPos*max(.5, trailMask));\t// distance to trail drops\n    \n    float mainDrop = S(.2, .1, d);\n    float dropTrail = S(.1, .02, td);\n    \n    dropTrail *= trailMask;\n    o = mix(bd*mainDrop, trailPos, dropTrail);\t\t// mix main drop and drop trail\n    \n    #ifdef DROP_DEBUG\n    if(uv2.x<.02 || uv2.y<.01) o = vec2(1.);\n    #endif\n    \n    return o;\n}\n\nvoid CameraSetup(vec2 uv, vec3 pos, vec3 lookat, float zoom, float m) {\n\tro = pos;\n    vec3 f = normalize(lookat-ro);\n    vec3 r = cross(vec3(0., 1., 0.), f);\n    vec3 u = cross(f, r);\n    float t = iTime;\n    \n    vec2 offs = vec2(0.);\n    #ifdef RAIN\n    vec2 dropUv = uv; \n    \n    #ifdef HIGH_QUALITY\n    float x = (sin(t*.1)*.5+.5)*.5;\n    x = -x*x;\n    float s = sin(x);\n    float c = cos(x);\n    \n    mat2 rot = mat2(c, -s, s, c);\n   \n    #ifndef DROP_DEBUG\n    dropUv = uv*rot;\n    dropUv.x += -sin(t*.1)*.5;\n    #endif\n    #endif\n    \n    offs = GetDrops(dropUv, 1., m);\n    \n    #ifndef DROP_DEBUG\n    offs += GetDrops(dropUv*1.4, 10., m);\n    #ifdef HIGH_QUALITY\n    offs += GetDrops(dropUv*2.4, 25., m);\n    //offs += GetDrops(dropUv*3.4, 11.);\n    //offs += GetDrops(dropUv*3., 2.);\n    #endif\n    \n    float ripple = sin(t+uv.y*3.1415*30.+uv.x*124.)*.5+.5;\n    ripple *= .005;\n    offs += vec2(ripple*ripple, ripple);\n    #endif\n    #endif\n    vec3 center = ro + f*zoom;\n    vec3 i = center + (uv.x-offs.x)*r + (uv.y-offs.y)*u;\n    \n    rd = normalize(i-ro);\n}\n\nvec3 HeadLights(float i, float t) {\n    float z = fract(-t*2.+i);\n    vec3 p = vec3(-.3, .1, z*40.);\n    float d = length(p-ro);\n    \n    float size = mix(.03, .05, S(.02, .07, z))*d;\n    float m = 0.;\n    float blur = .1;\n    m += BokehMask(ro, rd, p-vec3(.08, 0., 0.), size, blur);\n    m += BokehMask(ro, rd, p+vec3(.08, 0., 0.), size, blur);\n    \n    #ifdef HIGH_QUALITY\n    m += BokehMask(ro, rd, p+vec3(.1, 0., 0.), size, blur);\n    m += BokehMask(ro, rd, p-vec3(.1, 0., 0.), size, blur);\n    #endif\n    \n    float distFade = max(.01, pow(1.-z, 9.));\n    \n    blur = .8;\n    size *= 2.5;\n    float r = 0.;\n    r += BokehMask(ro, rd, p+vec3(-.09, -.2, 0.), size, blur);\n    r += BokehMask(ro, rd, p+vec3(.09, -.2, 0.), size, blur);\n    r *= distFade*distFade;\n    \n    return headLightCol*(m+r)*distFade;\n}\n\n\nvec3 TailLights(float i, float t) {\n    t = t*1.5+i;\n    \n    float id = floor(t)+i;\n    vec3 n = N31(id);\n    \n    float laneId = S(LANE_BIAS, LANE_BIAS+.01, n.y);\n    \n    float ft = fract(t);\n    \n    float z = 3.-ft*3.;\t\t\t\t\t\t// distance ahead\n    \n    laneId *= S(.2, 1.5, z);\t\t\t\t// get out of the way!\n    float lane = mix(.6, .3, laneId);\n    vec3 p = vec3(lane, .1, z);\n    float d = length(p-ro);\n    \n    float size = .05*d;\n    float blur = .1;\n    float m = BokehMask(ro, rd, p-vec3(.08, 0., 0.), size, blur) +\n    \t\t\tBokehMask(ro, rd, p+vec3(.08, 0., 0.), size, blur);\n    \n    #ifdef HIGH_QUALITY\n    float bs = n.z*3.;\t\t\t\t\t\t// start braking at random distance\t\t\n    float brake = S(bs, bs+.01, z);\n    brake *= S(bs+.01, bs, z-.5*n.y);\t\t// n.y = random brake duration\n    \n    m += (BokehMask(ro, rd, p+vec3(.1, 0., 0.), size, blur) +\n    \tBokehMask(ro, rd, p-vec3(.1, 0., 0.), size, blur))*brake;\n    #endif\n    \n    float refSize = size*2.5;\n    m += BokehMask(ro, rd, p+vec3(-.09, -.2, 0.), refSize, .8);\n    m += BokehMask(ro, rd, p+vec3(.09, -.2, 0.), refSize, .8);\n    vec3 col = tailLightCol*m*ft; \n    \n    float b = BokehMask(ro, rd, p+vec3(.12, 0., 0.), size, blur);\n    b += BokehMask(ro, rd, p+vec3(.12, -.2, 0.), refSize, .8)*.2;\n    \n    vec3 blinker = vec3(1., .7, .2);\n    blinker *= S(1.5, 1.4, z)*S(.2, .3, z);\n    blinker *= sat(sin(t*200.)*100.);\n    blinker *= laneId;\n    col += blinker*b;\n    \n    return col;\n}\n\nvec3 StreetLights(float i, float t) {\n\t float side = sign(rd.x);\n    float offset = max(side, 0.)*(1./16.);\n    float z = fract(i-t+offset); \n    vec3 p = vec3(2.*side, 2., z*60.);\n    float d = length(p-ro);\n\tfloat blur = .1;\n    vec3 rp = ClosestPoint(ro, rd, p);\n    float distFade = Remap(1., .7, .1, 1.5, 1.-pow(1.-z,6.));\n    distFade *= (1.-z);\n    float m = BokehMask(ro, rd, p, .05*d, blur)*distFade;\n    \n    return m*streetLightCol;\n}\n\nvec3 EnvironmentLights(float i, float t) {\n\tfloat n = N(i+floor(t));\n    \n    float side = sign(rd.x);\n    float offset = max(side, 0.)*(1./16.);\n    float z = fract(i-t+offset+fract(n*234.));\n    float n2 = fract(n*100.);\n    vec3 p = vec3((3.+n)*side, n2*n2*n2*1., z*60.);\n    float d = length(p-ro);\n\tfloat blur = .1;\n    vec3 rp = ClosestPoint(ro, rd, p);\n    float distFade = Remap(1., .7, .1, 1.5, 1.-pow(1.-z,6.));\n    float m = BokehMask(ro, rd, p, .05*d, blur);\n    m *= distFade*distFade*.5;\n    \n    m *= 1.-pow(sin(z*6.28*20.*n)*.5+.5, 20.);\n    vec3 randomCol = vec3(fract(n*-34.5), fract(n*4572.), fract(n*1264.));\n    vec3 col = mix(tailLightCol, streetLightCol, fract(n*-65.42));\n    col = mix(col, randomCol, n);\n    return m*col*.2;\n}\n\nvoid mainImage( out vec4 fragColor, in vec2 fragCoord )\n{\n\tfloat t = iTime;\n    vec3 col = vec3(0.);\n    vec2 uv = fragCoord.xy / iResolution.xy; // 0 <> 1\n    \n    uv -= .5;\n    uv.x *= iResolution.x/iResolution.y;\n    \n    vec2 mouse = iMouse.xy/iResolution.xy;\n    \n    vec3 pos = vec3(.3, .15, 0.);\n    \n    float bt = t * 5.;\n    float h1 = N(floor(bt));\n    float h2 = N(floor(bt+1.));\n    float bumps = mix(h1, h2, fract(bt))*.1;\n    bumps = bumps*bumps*bumps*CAM_SHAKE;\n    \n    pos.y += bumps;\n    float lookatY = pos.y+bumps;\n    vec3 lookat = vec3(0.3, lookatY, 1.);\n    vec3 lookat2 = vec3(0., lookatY, .7);\n    lookat = mix(lookat, lookat2, sin(t*.1)*.5+.5);\n    \n    uv.y += bumps*4.;\n    CameraSetup(uv, pos, lookat, 2., mouse.x);\n   \n    t *= .03;\n    t += mouse.x;\n    \n    // fix for GLES devices by MacroMachines\n    #ifdef GL_ES\n\tconst float stp = 1./8.;\n\t#else\n\tfloat stp = 1./8.;\n\t#endif\n    \n    for(float i=0.; i<1.; i+=stp) {\n       col += StreetLights(i, t);\n    }\n    \n    for(float i=0.; i<1.; i+=stp) {\n        float n = N(i+floor(t));\n    \tcol += HeadLights(i+n*stp*.7, t);\n    }\n    \n    #ifndef GL_ES\n    #ifdef HIGH_QUALITY\n    stp = 1./32.;\n    #else\n    stp = 1./16.;\n    #endif\n    #endif\n    \n    for(float i=0.; i<1.; i+=stp) {\n       col += EnvironmentLights(i, t);\n    }\n    \n    col += TailLights(0., t);\n    col += TailLights(.5, t);\n    \n    col += sat(rd.y)*vec3(.6, .5, .9);\n    \n\tfragColor = vec4(col, 0.);\n}",
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
          "mFlagMusicStream": true
        },
        "info": {
          "id": "MdfBRX",
          "date": "1498981597",
          "viewed": 81842,
          "name": "The Drive Home",
          "username": "BigWIngs",
          "description": "See comment block for details. Use mouse to scrub time. Hope you like it!\n\nVideo of the effect:\nhttps://www.youtube.com/watch?v=WrxZ4AZPdOQ\n\nMaking of tutorial:\nhttps://www.youtube.com/watch?v=eKtsY7hYTPg",
          "likes": 848,
          "published": 1,
          "flags": 64,
          "usePreview": 0,
          "tags": [
            "bokeh",
            "glass",
            "rain",
            "window",
            "nightdrive"
          ],
          "hasliked": 0,
          "parentid": "",
          "parentname": ""
        }
      }
];

compileAndStart(jsnShader);