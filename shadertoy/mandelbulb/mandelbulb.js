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
            "code": "// CC0: Inside the mandelbulb II\n//  Received some \"complaints\" about the old mandelbulb suffering from \n//  alias effects. So thought I make a quick try to apply the FXAA\n//  thing I learnt from XorDev. It did improve it but not perfect still.\n\n// When experimenting with this shader I realized this entire shader is \n// basically just a lucky bug (apart from the aliasing)\n\n#define RESOLUTION      iResolution\n\n// License: Unknowon, author: XorDev, found: https://github.com/XorDev/GM_FXAA\nvec4 fxaa(sampler2D tex, vec2 uv, vec2 texelSz) {\n  // See this blog\n  // https://mini.gmshaders.com/p/gm-shaders-mini-fxaa\n\n  // Maximum texel span\n  const float span_max    = 8.0;\n  // These are more technnical and probably don't need changing:\n  // Minimum \"dir\" reciprocal\n  const float reduce_min  = (1.0/128.0);\n  // Luma multiplier for \"dir\" reciprocal\n  const float reduce_mul  = (1.0/32.0);\n\n  const vec3  luma        = vec3(0.299, 0.587, 0.114);\n\n  // Sample center and 4 corners\n  vec3 rgbCC = texture(tex, uv).rgb;\n  vec3 rgb00 = texture(tex, uv+vec2(-0.5,-0.5)*texelSz).rgb;\n  vec3 rgb10 = texture(tex, uv+vec2(+0.5,-0.5)*texelSz).rgb;\n  vec3 rgb01 = texture(tex, uv+vec2(-0.5,+0.5)*texelSz).rgb;\n  vec3 rgb11 = texture(tex, uv+vec2(+0.5,+0.5)*texelSz).rgb;\n\n  //Get luma from the 5 samples\n  float lumaCC = dot(rgbCC, luma);\n  float luma00 = dot(rgb00, luma);\n  float luma10 = dot(rgb10, luma);\n  float luma01 = dot(rgb01, luma);\n  float luma11 = dot(rgb11, luma);\n\n  // Compute gradient from luma values\n  vec2 dir = vec2((luma01 + luma11) - (luma00 + luma10), (luma00 + luma01) - (luma10 + luma11));\n\n  // Diminish dir length based on total luma\n  float dirReduce = max((luma00 + luma10 + luma01 + luma11) * reduce_mul, reduce_min);\n\n  // Divide dir by the distance to nearest edge plus dirReduce\n  float rcpDir = 1.0 / (min(abs(dir.x), abs(dir.y)) + dirReduce);\n\n  // Multiply by reciprocal and limit to pixel span\n  dir = clamp(dir * rcpDir, -span_max, span_max) * texelSz.xy;\n\n  // Average middle texels along dir line\n  vec4 A = 0.5 * (\n      texture(tex, uv - dir * (1.0/6.0))\n    + texture(tex, uv + dir * (1.0/6.0))\n    );\n\n  // Average with outer texels along dir line\n  vec4 B = A * 0.5 + 0.25 * (\n      texture(tex, uv - dir * (0.5))\n    + texture(tex, uv + dir * (0.5))\n    );\n\n\n  // Get lowest and highest luma values\n  float lumaMin = min(lumaCC, min(min(luma00, luma10), min(luma01, luma11)));\n  float lumaMax = max(lumaCC, max(max(luma00, luma10), max(luma01, luma11)));\n\n  // Get average luma\n  float lumaB = dot(B.rgb, luma);\n\n  //If the average is outside the luma range, using the middle average\n  return ((lumaB < lumaMin) || (lumaB > lumaMax)) ? A : B;\n}\n\nvoid mainImage( out vec4 fragColor, in vec2 fragCoord ) {\n  vec2 q = fragCoord/RESOLUTION.xy;\n  \n  fragColor = fxaa(iChannel0, q, sqrt(2.0)/RESOLUTION.xy);\n}\n",
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
            "code": "// CC0: Inside the mandelbulb II\n//  Received some \"complaints\" about the old mandelbulb suffering from \n//  alias effects. So thought I make a quick try to apply the FXAA\n//  thing I learnt from XorDev. It did improve it but not perfect still.\n\n// When experimenting with this shader I realized this entire shader is \n// basically just a lucky bug (apart from the aliasing)\n\n// --\n#define LOOPS   2    // 4+ and higher to show off you expensive GPU\n#define POWER   8.0\n#define ANIMATE\n// --\n\n#define PI              3.141592654\n#define TAU             (2.0*PI)\n#define PHI             (sqrt(5.0)*0.5 + 0.5)\n\n#define TIME            iTime\n#define RESOLUTION      iResolution\n\n#define TOLERANCE       0.0001\n#define MAX_RAY_LENGTH  20.0\n#define MAX_RAY_MARCHES 60\n#define NORM_OFF        0.005\n#define MAX_BOUNCES     5\n\n\nmat3 g_rot  = mat3(1.0); \n\n// License: WTFPL, author: sam hocevar, found: https://stackoverflow.com/a/17897228/418488\nconst vec4 hsv2rgb_K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);\nvec3 hsv2rgb(vec3 c) {\n  vec3 p = abs(fract(c.xxx + hsv2rgb_K.xyz) * 6.0 - hsv2rgb_K.www);\n  return c.z * mix(hsv2rgb_K.xxx, clamp(p - hsv2rgb_K.xxx, 0.0, 1.0), c.y);\n}\n// License: WTFPL, author: sam hocevar, found: https://stackoverflow.com/a/17897228/418488\n//  Macro version of above to enable compile-time constants\n#define HSV2RGB(c)  (c.z * mix(hsv2rgb_K.xxx, clamp(abs(fract(c.xxx + hsv2rgb_K.xyz) * 6.0 - hsv2rgb_K.www) - hsv2rgb_K.xxx, 0.0, 1.0), c.y))\n\nconst float hoff = 0.0;\n\nconst vec3 skyCol     = HSV2RGB(vec3(hoff+0.6, 0.86, 1.0));\nconst vec3 glowCol    = HSV2RGB(vec3(hoff+0.065, 0.8, 6.0));\nconst vec3 diffuseCol = HSV2RGB(vec3(hoff+0.6, 0.85, 1.0));\nconst vec3 lightPos   = vec3(0.0, 10.0, 0.0);\nconst vec3 mat        = vec3(0.8, 0.5, (1.+0.05));\nconst vec3 beer       = -HSV2RGB(vec3(0.05, 0.95, 2.0)); \nconst float initt     = 0.1; \n\n// License: Unknown, author: nmz (twitter: @stormoid), found: https://www.shadertoy.com/view/NdfyRM\nvec3 sRGB(vec3 t) {\n  return mix(1.055*pow(t, vec3(1./2.4)) - 0.055, 12.92*t, step(t, vec3(0.0031308)));\n}\n\n// License: Unknown, author: Matt Taylor (https://github.com/64), found: https://64.github.io/tonemapping/\nvec3 aces_approx(vec3 v) {\n  v = max(v, 0.0);\n  v *= 0.6f;\n  float a = 2.51f;\n  float b = 0.03f;\n  float c = 2.43f;\n  float d = 0.59f;\n  float e = 0.14f;\n  return clamp((v*(a*v+b))/(v*(c*v+d)+e), 0.0f, 1.0f);\n}\n\n// License: MIT, author: Inigo Quilez, found: https://iquilezles.org/www/articles/distfunctions2d/distfunctions2d.htm\nfloat box(vec2 p, vec2 b) {\n  vec2 d = abs(p)-b;\n  return length(max(d,0.0)) + min(max(d.x,d.y),0.0);\n}\n\n// License: MIT, author: Inigo Quilez, found: https://iquilezles.org/www/articles/intersectors/intersectors.htm\nfloat rayPlane(vec3 ro, vec3 rd, vec4 p) {\n  return -(dot(ro,p.xyz)+p.w)/dot(rd,p.xyz);\n}\n\n// License: Unknown, author: EvilRyu, found: https://www.shadertoy.com/view/MdXSWn\nfloat mandelBulb(vec3 p) {\n\n  const float power = POWER;\n  vec3 z  = p;\n  vec3 dz = vec3(0.0);\n  float r, theta, phi;\n  float dr = 1.0;\n  \n  for(int i = 0; i < LOOPS; ++i) {\n    r = length(z);\n    if(r > 2.0) continue;\n    theta = atan(z.y, z.x);\n#ifdef ANIMATE\n    phi = asin(z.z / r) + TIME*0.2;\n#else\n    phi = asin(z.z / r);\n#endif\n    \n    dr = pow(r, power - 1.0) * dr * power + 1.0;\n  \n    r = pow(r, power);\n    theta = theta * power;\n    phi = phi * power;\n    \n    z = r * vec3(cos(theta)*cos(phi), sin(theta)*cos(phi), sin(phi)) + p;\n  }\n  return 0.5 * log(r) * r / dr;\n}\n\n\n\n\nmat3 rot_z(float a) {\n  float c = cos(a);\n  float s = sin(a);\n  return mat3(\n      c,s,0\n    ,-s,c,0\n    , 0,0,1\n    );\n}\n\nmat3 rot_y(float a) {\n  float c = cos(a);\n  float s = sin(a);\n  return mat3(\n      c,0,s\n    , 0,1,0\n    ,-s,0,c\n    );\n}\n\nmat3 rot_x(float a) {\n  float c = cos(a);\n  float s = sin(a);\n  return mat3(\n      1, 0,0\n    , 0, c,s\n    , 0,-s,c\n    );\n}\n\nvec3 skyColor(vec3 ro, vec3 rd) {\n  vec3 col = clamp(vec3(0.0025/abs(rd.y))*skyCol, 0.0, 1.0);\n\n  float tp0  = rayPlane(ro, rd, vec4(vec3(0.0, 1.0, 0.0), 4.0));\n  float tp1  = rayPlane(ro, rd, vec4(vec3(0.0, -1.0, 0.0), 6.0));\n  float tp = tp1;\n  tp = max(tp0,tp1);\n\n\n  if (tp1 > 0.0) {\n    vec3 pos  = ro + tp1*rd;\n    vec2 pp = pos.xz;\n    float db = box(pp, vec2(6.0, 9.0))-1.0;\n    \n    col += vec3(4.0)*skyCol*rd.y*rd.y*smoothstep(0.25, 0.0, db);\n    col += vec3(0.8)*skyCol*exp(-0.5*max(db, 0.0));\n  }\n\n  if (tp0 > 0.0) {\n    vec3 pos  = ro + tp0*rd;\n    vec2 pp = pos.xz;\n    float ds = length(pp) - 0.5;\n    \n    col += vec3(0.25)*skyCol*exp(-.5*max(ds, 0.0));\n  }\n\n  return clamp(col, 0.0, 10.0);\n}\n\nfloat df(vec3 p) {\n  p *= g_rot;\n  const float z1 = 2.0;\n  return mandelBulb(p/z1)*z1;\n}\n\n\nvec3 normal(vec3 pos) {\n  vec2  eps = vec2(NORM_OFF,0.0);\n  vec3 nor;\n  nor.x = df(pos+eps.xyy) - df(pos-eps.xyy);\n  nor.y = df(pos+eps.yxy) - df(pos-eps.yxy);\n  nor.z = df(pos+eps.yyx) - df(pos-eps.yyx);\n  return normalize(nor);\n}\n\nfloat rayMarch(vec3 ro, vec3 rd, float dfactor, out int ii) {\n  float t = 0.0;\n  float tol = dfactor*TOLERANCE;\n  ii = MAX_RAY_MARCHES;\n  for (int i = 0; i < MAX_RAY_MARCHES; ++i) {\n    if (t > MAX_RAY_LENGTH) {\n      t = MAX_RAY_LENGTH;    \n      break;\n    }\n    float d = dfactor*df(ro + rd*t);\n    if (d < TOLERANCE) {\n      ii = i;\n      break;\n    }\n    t += d;\n  }\n  return t;\n}\n\nvec3 render(vec3 ro, vec3 rd) {\n  vec3 agg = vec3(0.0, 0.0, 0.0);\n  vec3 ragg = vec3(1.0);\n\n  bool isInside = df(ro) < 0.0;\n\n  for (int bounce = 0; bounce < MAX_BOUNCES; ++bounce) {\n    float dfactor = isInside ? -1.0 : 1.0;\n    float mragg = max(max(ragg.x, ragg.y), ragg.z);\n    if (mragg < 0.025) break;\n    int iter;\n    float st = rayMarch(ro, rd, dfactor, iter);\n    const float mrm = 1.0/float(MAX_RAY_MARCHES);\n    float ii = float(iter)*mrm;\n    if (st >= MAX_RAY_LENGTH) {\n      agg += ragg*skyColor(ro, rd);\n      break; \n    }\n\n    vec3 sp = ro+rd*st;\n\n    vec3 sn = dfactor*normal(sp);\n    float fre = 1.0+dot(rd, sn);\n    fre *= fre;\n    fre = mix(0.1, 1.0, fre);\n\n    vec3 ld     = normalize(lightPos - sp);\n\n    float dif   = max(dot(ld, sn), 0.0); \n    vec3 ref    = reflect(rd, sn);\n    float re    = mat.z;\n    float ire   = 1.0/re;\n    vec3 refr   = refract(rd, sn, !isInside ? re : ire);\n    vec3 rsky   = skyColor(sp, ref);\n    vec3 col = vec3(0.0);    \n    col += diffuseCol*dif*dif*(1.0-mat.x);\n    float edge = smoothstep(1.0, 0.9, fre);\n    col += rsky*mat.y*fre*vec3(1.0)*edge;\n    if (isInside) {\n      ragg *= exp(-(st+initt)*beer);\n    }\n    agg += ragg*col;\n\n    if (refr == vec3(0.0)) {\n      rd = ref;\n    } else {\n      ragg *= mat.x;\n      isInside = !isInside;\n      rd = refr;\n    }\n\n    ro = sp+initt*rd;\n  }\n\n  return agg;\n}\n\nvec3 effect(vec2 p) {\n  g_rot = rot_x(0.2*TIME)*rot_y(0.3*TIME);\n  vec3 ro = 0.6*vec3(0.0, 2.0, 5.0);\n  const vec3 la = vec3(0.0, 0.0, 0.0);\n  const vec3 up = vec3(0.0, 1.0, 0.0);\n\n  vec3 ww = normalize(la - ro);\n  vec3 uu = normalize(cross(up, ww ));\n  vec3 vv = (cross(ww,uu));\n  const float fov = tan(TAU/6.);\n  vec3 rd = normalize(-p.x*uu + p.y*vv + fov*ww);\n\n  vec3 col = render(ro, rd);\n  \n  return col;\n}\n\nvoid mainImage( out vec4 fragColor, in vec2 fragCoord ) {\n  vec2 q = fragCoord/RESOLUTION.xy;\n  vec2 p = -1. + 2. * q;\n  p.x *= RESOLUTION.x/RESOLUTION.y;\n  vec3 col = vec3(0.0);\n  col = effect(p);\n  col = aces_approx(col); \n  col = sRGB(col);\n  fragColor = vec4(col, 1.0);\n}\n",
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
          "id": "mtScRc",
          "date": "1692095316",
          "viewed": 10836,
          "name": "Inside the mandelbulb II",
          "username": "mrange",
          "description": "CC0: Inside the mandelbulb II\nReceived some \"complaints\" about the old mandelbulb suffering from \nalias effects. So thought I make a quick try to apply the FXAA\nthing I learnt from XorDev. It did improve it but not perfect still.\n",
          "likes": 218,
          "published": 3,
          "flags": 32,
          "usePreview": 1,
          "tags": [
            "3d",
            "mandelbulb"
          ],
          "hasliked": 0,
          "parentid": "ftGcD3",
          "parentname": "Inside the mandelbulb"
        }
      }
];

compileAndStart(jsnShader);