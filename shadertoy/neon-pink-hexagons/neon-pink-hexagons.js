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
                "type": "buffer",
                "id": "XsXGR8",
                "filepath": "/media/previz/buffer01.png",
                "sampler": {
                  "filter": "linear",
                  "wrap": "clamp",
                  "vflip": "true",
                  "srgb": "false",
                  "internal": "byte"
                }
              }
            ],
            "code": "// License CC0: Hex Marching\n//  Results from saturday afternoon tinkering\n#define TIME iTime\nvoid mainImage(out vec4 fragColor, in vec2 fragCoord) {\n  vec2 q = fragCoord/iResolution.xy;\n\n  vec4 pcol = texture(iChannel0, q);\n  vec3 col = pcol.xyz;\n  col = clamp(col, 0.0, 1.0);\n  col *= smoothstep(0.0, 2.0, TIME);\n  col = sqrt(col);\n  \n  \n  // vignette from Ippokratis: https://www.shadertoy.com/view/lsKSWR\n  \n  vec2 uv = fragCoord.xy / iResolution.xy;\n   \n  uv *=  1.0 - uv.yx;   //vec2(1.0)- uv.yx; -> 1.-u.yx; Thanks FabriceNeyret !\n    \n  float vig = uv.x*uv.y * 15.0; // multiply with sth for intensity\n    \n  vig = pow(vig, 0.15); // change pow for modifying the extend of the  vignette\n\n  \n  fragColor = vec4(col * vig, 1.0);\n}",
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
            "inputs": [],
            "code": "// License CC0: Hex Marching\n#define RESOLUTION  iResolution\n#define TIME        iTime\n#define PI          3.141592654\n#define TAU         (2.0*PI)\n#define ROT(a)      mat2(cos(a), sin(a), -sin(a), cos(a))\n#define BPM         30.0\n\nconst float planeDist = 1.0-0.2;\n\n// License: WTFPL, author: sam hocevar, found: https://stackoverflow.com/a/17897228/418488\nconst vec4 hsv2rgb_K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);\nvec3 hsv2rgb(vec3 c) {\n  vec3 p = abs(fract(c.xxx + hsv2rgb_K.xyz) * 6.0 - hsv2rgb_K.www);\n  return c.z * mix(hsv2rgb_K.xxx, clamp(p - hsv2rgb_K.xxx, 0.0, 1.0), c.y);\n}\n// License: WTFPL, author: sam hocevar, found: https://stackoverflow.com/a/17897228/418488\n//  Macro version of above to enable compile-time constants\n#define HSV2RGB(c)  (c.z * mix(hsv2rgb_K.xxx, clamp(abs(fract(c.xxx + hsv2rgb_K.xyz) * 6.0 - hsv2rgb_K.www) - hsv2rgb_K.xxx, 0.0, 1.0), c.y))\n\n\n// License: Unknown, author: Unknown, found: don't remember\nvec4 alphaBlend(vec4 back, vec4 front) {\n  float w = front.w + back.w*(1.0-front.w);\n  vec3 xyz = (front.xyz*front.w + back.xyz*back.w*(1.0-front.w))/w;\n  return w > 0.0 ? vec4(xyz, w) : vec4(0.0);\n}\n\n// License: Unknown, author: Unknown, found: don't remember\nvec3 alphaBlend(vec3 back, vec4 front) {\n  return mix(back, front.xyz, front.w);\n}\n\n// License: Unknown, author: Unknown, found: don't remember\nfloat tanh_approx(float x) {\n  //  Found this somewhere on the interwebs\n  //  return tanh(x);\n  float x2 = x*x;\n  return clamp(x*(27.0 + x2)/(27.0+9.0*x2), -1.0, 1.0);\n}\n\n// License: Unknown, author: Unknown, found: don't remember\nfloat hash(float co) {\n  return fract(sin(co*12.9898) * 13758.5453);\n}\n\nvec3 offset(float z) {\n  float a = z;\n  vec2 p = -0.15*(vec2(cos(a), sin(a*sqrt(2.0))) + vec2(cos(a*sqrt(0.75)), sin(a*sqrt(0.5))));\n  return vec3(p, z);\n}\n\nvec3 doffset(float z) {\n  float eps = 0.05;\n  return 0.5*(offset(z + eps) - offset(z - eps))/(2.0*eps);\n}\n\nvec3 ddoffset(float z) {\n  float eps = 0.05;\n  return 0.5*(doffset(z + eps) - doffset(z - eps))/(2.0*eps);\n}\n\n// License: CC0, author: Mårten Rånge, found: https://github.com/mrange/glsl-snippets\nvec2 toPolar(vec2 p) {\n  return vec2(length(p), atan(p.y, p.x));\n}\n\n// License: CC0, author: Mårten Rånge, found: https://github.com/mrange/glsl-snippets\nvec2 toRect(vec2 p) {\n  return vec2(p.x*cos(p.y), p.x*sin(p.y));\n}\n\n// License: MIT OR CC-BY-NC-4.0, author: mercury, found: https://mercury.sexy/hg_sdf/\nfloat mod1(inout float p, float size) {\n  float halfsize = size*0.5;\n  float c = floor((p + halfsize)/size);\n  p = mod(p + halfsize, size) - halfsize;\n  return c;\n}\n\nvec2 hextile(inout vec2 p) {\n  // See Art of Code: Hexagonal Tiling Explained!\n  // https://www.youtube.com/watch?v=VmrIDyYiJBA\n  const vec2 sz       = vec2(1.0, sqrt(3.0));\n  const vec2 hsz      = 0.5*sz;\n\n  vec2 p1 = mod(p, sz)-hsz;\n  vec2 p2 = mod(p - hsz, sz)-hsz;\n  vec2 p3 = dot(p1, p1) < dot(p2, p2) ? p1 : p2;\n  vec2 n = ((p3 - p + hsz)/sz);\n  p = p3;\n\n  n -= vec2(0.5);\n  // Rounding to make hextile 0,0 well behaved\n  return round(n*2.0)*0.5;\n}\n\nvec4 effect(vec2 p, float aa, float h) {\n  vec2 hhn = hextile(p);\n  const float w = 0.02;\n  vec2 pp = toPolar(p);\n  float a = pp.y;\n  float hn = mod1(pp.y, TAU/6.0);\n  vec2 hp = toRect(pp);\n  float hd = hp.x-(w*10.0);\n  \n  float x = hp.x-0.5*w;\n  float n = mod1(x, w);\n  float d = abs(x)-(0.5*w-aa);\n  \n  float h0 = hash(10.0*(hhn.x+hhn.y)+2.0*h+n);\n  float h1 = fract(8667.0*h0);\n  float cut = mix(-0.5, 0.999, 0.5+0.5*sin(TIME+TAU*h0));\n  const float coln = 6.0;\n  float t = smoothstep(aa, -aa, d)*smoothstep(cut, cut-0.005, sin(a+2.0*(h1-0.5)*TIME+h1*TAU))*exp(-150.0*abs(x));\n  vec3 col = hsv2rgb(vec3((h0 > .5 ? 0. : .4) + (h0 - .5) / 15., 0.85, 1.0))*t*1.75;\n\n  t = mix(0.9, 1.0, t);\n  t *= smoothstep(aa, -aa, -hd);\n  if (hd < 0.0) {\n    col = vec3(0.0);\n    t = 15.*dot(p, p);\n  }\n  return vec4(col, t);\n}\n\nvec4 plane(vec3 ro, vec3 rd, vec3 pp, vec3 npp, vec3 off, float n) {\n  float h0 = hash(n);\n  float h1 = fract(8667.0*h0);\n\n  vec3 hn;\n  vec2 p  = (pp-off*vec3(1.0, 1.0, 0.0)).xy;\n  p *= ROT(TAU*h0);\n  p.x -= 0.25*h1*(pp.z-ro.z);\n  const float z = 1.0;\n  p /= z;\n  float aa = distance(pp,npp)*sqrt(1.0/3.0)/z;\n  vec4 col = effect(p, aa, h1);\n\n  return col;\n}\n\nvec3 skyColor(vec3 ro, vec3 rd) {\n  return vec3(0.0);\n}\n\nvec3 color(vec3 ww, vec3 uu, vec3 vv, vec3 ro, vec2 p) {\n  float lp = length(p);\n  vec2 np = p + 2.0/RESOLUTION.y;\n  float rdd = (2.-0.5*tanh_approx(lp));  // Playing around with rdd can give interesting distortions\n//  float rdd = 2.;\n  \n  vec3 rd = normalize(p.x*uu + p.y*vv + rdd*ww);\n  vec3 nrd = normalize(np.x*uu + np.y*vv + rdd*ww);\n\n  const int furthest = 5;\n  const int fadeFrom = max(furthest-2, 0);\n\n  const float fadeDist = planeDist*float(furthest - fadeFrom);\n  float nz = floor(ro.z / planeDist);\n\n  vec3 skyCol = skyColor(ro, rd);\n\n\n  vec4 acol = vec4(0.0);\n  const float cutOff = 0.95;\n  bool cutOut = false;\n\n  float maxpd = 0.0;\n\n  // Steps from nearest to furthest plane and accumulates the color \n  for (int i = 1; i <= furthest; ++i) {\n    float pz = planeDist*nz + planeDist*float(i);\n\n    float pd = (pz - ro.z)/rd.z;\n\n    if (pd > 0.0 && acol.w < cutOff) {\n      vec3 pp = ro + rd*pd;\n      maxpd = pd;\n      vec3 npp = ro + nrd*pd;\n\n      vec3 off = offset(pp.z);\n\n      vec4 pcol = plane(ro, rd, pp, npp, off, nz+float(i));\n\n      float nz = pp.z-ro.z;\n      float fadeIn = smoothstep(planeDist*float(furthest), planeDist*float(fadeFrom), nz);\n      float fadeOut = smoothstep(0.0, planeDist*0.1, nz);\n//      pcol.xyz = mix(skyCol, pcol.xyz, fadeIn);\n      pcol.w *= fadeOut*fadeIn;\n      pcol = clamp(pcol, 0.0, 1.0);\n\n      acol = alphaBlend(pcol, acol);\n    } else {\n      cutOut = true;\n      acol.w = acol.w > cutOff ? 1.0 : acol.w;\n      break;\n    }\n\n  }\n\n  vec3 col = alphaBlend(skyCol, acol);\n// To debug cutouts due to transparency  \n//  col += cutOut ? vec3(1.0, -1.0, 0.0) : vec3(0.0);\n  return col;\n}\n\nvec3 effect(vec2 p, vec2 q) {\n  float tm  = planeDist*TIME*BPM/60.0;\n  vec3 ro   = offset(tm);\n  vec3 dro  = doffset(tm);\n  vec3 ddro = ddoffset(tm);\n\n  vec3 ww = normalize(dro);\n  vec3 uu = normalize(cross(normalize(vec3(0.0,1.0,0.0)+ddro), ww));\n  vec3 vv = cross(ww, uu);\n\n  vec3 col = color(ww, uu, vv, ro, p);\n  \n  return col;\n}\n\nvoid mainImage(out vec4 fragColor, in vec2 fragCoord) {\n  vec2 q = fragCoord/RESOLUTION.xy;\n  vec2 p = -1. + 2. * q;\n  p.x *= RESOLUTION.x/RESOLUTION.y;\n\n  vec3 col = effect(p, q);\n  \n  fragColor = vec4(col, 1.0);\n}",
            "name": "Buffer A",
            "description": "",
            "type": "buffer"
          },
          {
            "outputs": [
              {
                "channel": 0,
                "id": "XsXGR8"
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
              },
              {
                "channel": 1,
                "type": "buffer",
                "id": "XsXGR8",
                "filepath": "/media/previz/buffer01.png",
                "sampler": {
                  "filter": "linear",
                  "wrap": "clamp",
                  "vflip": "true",
                  "srgb": "false",
                  "internal": "byte"
                }
              }
            ],
            "code": "// License CC0: Hex Marching\n#define RESOLUTION  iResolution\n#define TIME        iTime\n#define ROT(a)      mat2(cos(a), sin(a), -sin(a), cos(a))\n\nconst mat2 brot = ROT(2.399);\n//  simplyfied version of Dave Hoskins blur\nvec3 dblur(vec2 q,float rad) {\n  vec3 acc=vec3(0);\n  const float m = 0.002;\n  vec2 pixel=vec2(m*RESOLUTION.y/RESOLUTION.x,m);\n  vec2 angle=vec2(0,rad);\n  rad=1.;\n  const int iter = 30;\n  for (int j=0; j<iter; ++j) {  \n    rad += 1./rad;\n    angle*=brot;\n    vec4 col=texture(iChannel1,q+pixel*(rad-1.)*angle);\n    acc+=col.xyz;\n  }\n  return acc*(1.0/float(iter));\n}\n\nvoid mainImage(out vec4 fragColor, in vec2 fragCoord) {\n  vec2 q = fragCoord/RESOLUTION.xy;\n  vec2 p = -1.0+2.0*q;\n  vec4 pcol = texture(iChannel0,q);\n  vec3 bcol = dblur(q, .75);\n  \n  vec3 col = pcol.xyz;\n  col += vec3(0.9, .8, 1.2)*mix(0.5, 0.66, length(p))*(0.05+bcol);\n  \n  fragColor = vec4(col, 1.0);\n}\n",
            "name": "Buffer B",
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
          "id": "dsGfDm",
          "date": "1698275667",
          "viewed": 100,
          "name": "Hex marching + Vingette",
          "username": "GesChen",
          "description": "License CC0: Hex Marching\nResults from saturday afternoon tinkering\n\nfork changes: red and blue + vignette \nmakes a good screensaver to match my setup :D",
          "likes": 9,
          "published": 1,
          "flags": 32,
          "usePreview": 0,
          "tags": [
            "hexes"
          ],
          "hasliked": 0,
          "parentid": "NdKyDw",
          "parentname": "Hex marching"
        }
      }
];

compileAndStart(jsnShader);