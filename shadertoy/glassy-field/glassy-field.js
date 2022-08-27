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
                "id": "4sf3Rr",
                "filepath": "/media/a/ad56fba948dfba9ae698198c109e71f118a54d209c0ea50d77ea546abad89c57.png",
                "sampler": {
                  "filter": "mipmap",
                  "wrap": "repeat",
                  "vflip": "true",
                  "srgb": "false",
                  "internal": "byte"
                }
              },
              {
                "channel": 1,
                "type": "texture",
                "id": "XsX3Rn",
                "filepath": "/media/a/92d7758c402f0927011ca8d0a7e40251439fba3a1dac26f5b8b62026323501aa.jpg",
                "sampler": {
                  "filter": "mipmap",
                  "wrap": "repeat",
                  "vflip": "true",
                  "srgb": "false",
                  "internal": "byte"
                }
              }
            ],
            "code": "/*\n\n\tAbstract Glassy Field\n\t---------------------\n\n\tAn abstract, blobby-looking field - rendered in the style of hot, glowing glass. It was \n\tproduced using cheap low-budget psuedoscience. :)\n\n\tThe surface was constructed with a spherized sinusoidal function, of sorts. I like it, because \n\tit's very cheap to produce, mildly reminiscent of noise and allows a camera to pass through it \n\twithout having to resort to trickery.\n\n\tThe fluid filled glass look is fake, but at least interesting to look at. Basically, it was\n\tproduced by indexing the reflected and refracted surface rays into a 3D tri-planar texture\n\tlookup. By the way, I've tried the real thing on this particular surface - with multiple ray \n\tbounces and so forth - and to say it's slower is an understatement. :)\n\n\tBy the way, if anyone is aware of some cheap and simple improvements, corrections, etc, feel\n\tfree to let me know.\n\n*/\n\n#define FAR 50. // Far plane, or maximum distance.\n\n//float objID = 0.; // Object ID\n\nfloat accum; // Used to create the glow, by accumulating values in the raymarching function.\n\n// 2x2 matrix rotation. Note the absence of \"cos.\" It's there, but in disguise, and comes courtesy\n// of Fabrice Neyret's \"ouside the box\" thinking. :)\nmat2 rot2( float a ){ vec2 v = sin(vec2(1.570796, 0) - a);\treturn mat2(v, -v.y, v.x); }\n\n\n// Tri-Planar blending function. Based on an old Nvidia writeup:\n// GPU Gems 3 - Ryan Geiss: https://developer.nvidia.com/gpugems/GPUGems3/gpugems3_ch01.html\nvec3 tpl( sampler2D t, in vec3 p, in vec3 n ){\n    \n    n = max(abs(n) - .2, 0.001);\n    n /= dot(n, vec3(1));\n\tvec3 tx = texture(t, p.zy).xyz;\n    vec3 ty = texture(t, p.xz).xyz;\n    vec3 tz = texture(t, p.xy).xyz;\n    \n    // Textures are stored in sRGB (I think), so you have to convert them to linear space \n    // (squaring is a rough approximation) prior to working with them... or something like that. :)\n    // Once the final color value is gamma corrected, you should see correct looking colors.\n    return (tx*tx*n.x + ty*ty*n.y + tz*tz*n.z);\n}\n\n\n// Camera path.\nvec3 camPath(float t){\n  \n    //return vec3(0, 0, t); // Straight path.\n    //return vec3(-sin(t/2.), sin(t/2.)*.5 + 1.57, t); // Windy path.\n    \n    //float s = sin(t/24.)*cos(t/12.);\n    //return vec3(s*12., 0., t);\n    \n    float a = sin(t * 0.11);\n    float b = cos(t * 0.14);\n    return vec3(a*4. -b*1.5, b*1.7 + a*1.5, t);\n    \n}\n\n\n// A fake, noisy looking field - cheaply constructed from a spherized sinusoidal\n// combination. I came up with it when I was bored one day. :) Lousy to hone in\n// on, but it has the benefit of being able to guide a camera through it.\nfloat map(vec3 p){\n \n    p.xy -= camPath(p.z).xy; // Perturb the object around the camera path.\n    \n     \n\t//p = cos(p*.315*1.25 + sin(p.zxy*.875*1.25)); // 3D sinusoidal mutation.\n    //\n    // Partial fix to alleviate artifacts after running the program for a while.\n    // Thanks to Reyparis and Ollj.\n    float PI = 3.14159265358979;\n    p = cos(mod(p*.315*1.25 + sin(mod(p.zxy*.875*1.25, 2.*PI)), 2.*PI));\n    \n    float n = length(p); // Spherize. The result is some mutated, spherical blob-like shapes.\n\n    // It's an easy field to create, but not so great to hone in one. The \"1.4\" fudge factor\n    // is there to get a little extra distance... Obtained by trial and error.\n    return (n - 1.025)*1.33;\n    \n}\n\n/*\n// Alternative, even more abstract, field.\nfloat map(vec3 p){\n    \n    p.xy -= camPath(p.z).xy; // Perturb the object around the camera path.\n   \n\tp = cos(p*.1575 + sin(p.zxy*.4375)); // 3D sinusoidal mutation.\n    \n    // Spherize. The result is some mutated, spherical blob-like shapes.\n    float n = dot(p, p); \n    \n    p = sin(p*3.+cos(p.yzx*3.)); // Finer bumps. Subtle.\n    \n    return (n - p.x*p.y*p.z*.35 - .9)*1.33; // Combine, and we're done.\n    \n}\n*/\n\n\n// I keep a collection of occlusion routines... OK, that sounded really nerdy. :)\n// Anyway, I like this one. I'm assuming it's based on IQ's original.\nfloat cao(in vec3 p, in vec3 n)\n{\n\tfloat sca = 1., occ = 0.;\n    for(float i=0.; i<5.; i++){\n    \n        float hr = .01 + i*.35/4.;        \n        float dd = map(n * hr + p);\n        occ += (hr - dd)*sca;\n        sca *= .7;\n    }\n    return clamp(1. - occ, 0., 1.);    \n}\n\n\n// Standard normal function. It's not as fast as the tetrahedral calculation, but more symmetrical.\nvec3 nr(vec3 p){\n\n\tconst vec2 e = vec2(.002, 0);\n\treturn normalize(vec3(map(p + e.xyy) - map(p - e.xyy), \n                          map(p + e.yxy) - map(p - e.yxy), map(p + e.yyx) - map(p - e.yyx)));\n}\n\n\n\n// Basic raymarcher.\nfloat trace(in vec3 ro, in vec3 rd){\n    \n    accum = 0.;\n    float t = 0., h;\n    for(int i = 0; i < 128; i++){\n    \n        h = map(ro + rd*t);\n        // Note the \"t*b + a\" addition. Basically, we're putting less emphasis on accuracy, as\n        // \"t\" increases. It's a cheap trick that works in most situations... Not all, though.\n        if(abs(h)<.001*(t*.25 + 1.) || t>FAR) break; // Alternative: 0.001*max(t*.25, 1.)\n        t += h;\n        \n        // Simple distance-based accumulation to produce some glow.\n        if(abs(h)<.35) accum += (.35 - abs(h))/24.;\n        \n    }\n\n    return min(t, FAR);\n}\n\n\n// Shadows.\nfloat sha(in vec3 ro, in vec3 rd, in float start, in float end, in float k){\n\n    float shade = 1.;\n    const int maxIterationsShad = 24; \n\n    float dist = start;\n    float stepDist = end/float(maxIterationsShad);\n\n    for (int i=0; i<maxIterationsShad; i++){\n        float h = map(ro + rd*dist);\n        //shade = min(shade, k*h/dist);\n        shade = min(shade, smoothstep(0.0, 1.0, k*h/dist));\n\n        dist += clamp(h, .01, .2);\n        \n        // There's some accuracy loss involved, but early exits from accumulative distance function can help.\n        if (abs(h)<0.001 || dist > end) break; \n    }\n    \n    return min(max(shade, 0.) + .4, 1.); \n}\n\n\n// Texture bump mapping. Four tri-planar lookups, or 12 texture lookups in total.\nvec3 db( sampler2D tx, in vec3 p, in vec3 n, float bf){\n   \n    const vec2 e = vec2(.001, 0);\n    \n    // Three gradient vectors rolled into a matrix, constructed with offset greyscale texture values.    \n    mat3 m = mat3( tpl(tx, p - e.xyy, n), tpl(tx, p - e.yxy, n), tpl(tx, p - e.yyx, n));\n    \n    vec3 g = vec3(.299, .587, .114)*m; // Converting to greyscale.\n    g = (g - dot(tpl(tx,  p , n), vec3(.299, .587, .114)) )/e.x; g -= n*dot(n, g);\n                      \n    return normalize(n + g*bf); // Bumped normal. \"bf\" - bump factor.\n\t\n}\n\n// Compact, self-contained version of IQ's 3D value noise function. I have a transparent noise\n// example that explains it, if you require it.\nfloat n3D(vec3 p){\n    \n\tconst vec3 s = vec3(7, 157, 113);\n\tvec3 ip = floor(p); p -= ip; \n    vec4 h = vec4(0., s.yz, s.y + s.z) + dot(ip, s);\n    p = p*p*(3. - 2.*p); //p *= p*p*(p*(p * 6. - 15.) + 10.);\n    h = mix(fract(sin(h)*43758.5453), fract(sin(h + s.x)*43758.5453), p.x);\n    h.xy = mix(h.xz, h.yw, p.y);\n    return mix(h.x, h.y, p.z); // Range: [0, 1].\n}\n\n\n\n// Simple environment mapping.\nvec3 envMap(vec3 rd, vec3 n){\n    \n    vec3 col = tpl(iChannel1, rd*4., n);\n    return smoothstep(0., 1., col);\n}\n\n\nvoid mainImage( out vec4 fragColor, in vec2 fragCoord ){\n    \n    \n\t// Screen coordinates.\n\tvec2 u = (fragCoord - iResolution.xy*.5)/iResolution.y;\n\t\n\t// Camera Setup.\n    float speed = 4.;\n    vec3 o = camPath(iTime*speed); // Camera position, doubling as the ray origin.\n    vec3 lk = camPath(iTime*speed + .25);  // \"Look At\" position.\n    vec3 l = camPath(iTime*speed + 2.) + vec3(0, 1, 0); // Light position, somewhere near the moving camera.\n\n\n    // Using the above to produce the unit ray-direction vector.\n    float FOV = 3.14159/2.; ///3. FOV - Field of view.\n    vec3 fwd = normalize(lk-o);\n    vec3 rgt = normalize(vec3(fwd.z, 0, -fwd.x )); \n    vec3 up = cross(fwd, rgt);\n\n    // Unit direction ray.\n    //vec3 r = normalize(fwd + FOV*(u.x*rgt + u.y*up));\n    // Lens distortion.\n    vec3 r = fwd + FOV*(u.x*rgt + u.y*up);\n    r = normalize(vec3(r.xy, (r.z - length(r.xy)*.125)));\n\n\n    // Raymarch.\n    float t = trace(o, r);\n    \n    // Save the object ID directly after the raymarching equation, since other equations that\n    // use the \"map\" function will distort the results. I leaned that the hard way. :)\n    //float sObjID = objID;\n\n    // Initialize the scene color to the background.\n    vec3 col = vec3(0);\n    \n    // If the surface is hit, light it up.\n    if(t<FAR){\n    \n        // Position.\n        vec3 p = o + r*t;\n\t\t\n        // Normal.\n        vec3 n = nr(p);\n        \n        // Sometimes, it's handy to keep a copy of the normal. In this case, I'd prefer the\n        // bumps on the surface to not have as much influence on the reflrection and \n        // refraction vectors, so I tone down the bumped normal with this. See the reflection\n        // and refraction lines.\n        vec3 svn = n;\n        \n        // Texture bump the normal.\n        float sz = 1./3.; \n        n = db(iChannel0, p*sz, n, .1/(1. + t*.25/FAR));\n\n        l -= p; // Light to surface vector. Ie: Light direction vector.\n        float d = max(length(l), 0.001); // Light to surface distance.\n        l /= d; // Normalizing the light direction vector.\n\n        \n        float at = 1./(1. + d*.05 + d*d*.0125); // Light attenuation.\n        \n        // Ambient occlusion and shadowing.\n        float ao =  cao(p, n);\n        float sh = sha(p, l, 0.04, d, 16.);\n        \n        // Diffuse, specular, fresnel. Only the latter is being used here.\n        float di = max(dot(l, n), 0.);\n        float sp = pow(max( dot( reflect(r, n), l ), 0.), 64.); // Specular term.\n        float fr = clamp(1.0 + dot(r, n), .0, 1.); // Fresnel reflection term.\n \n         \n        \n        // Texturing - or coloring - the surface. The \"color\"' of glass is provide by the surrounds...\n        // of it's contents, so just make it dark.\n        vec3 tx = vec3(.05); // tpl(iChannel0, p*sz, n);\n         \n\n\t\t// Very simple coloring.\n        col = tx*(di*.1 + ao*.25) + vec3(.5, .7, 1)*sp*2. + vec3(1, .7, .4)*pow(fr, 8.)*.25;\n \n        // Very cheap, and totally fake, reflection and refraction. Obtain the reflection and\n        // refraction vectors at the surface, then pass them to the environment mapping function.\n        // Note that glass and fluid have different refractive indices, so I've fudged them into \n        // one figure.\n        vec3 refl = envMap(normalize(reflect(r, svn*.5 + n*.5)), svn*.5 + n*.5);\n        vec3 refr = envMap(normalize(refract(r, svn*.5 + n*.5, 1./1.35)), svn*.5 + n*.5);\n        \n        /*\n\t\t// You can also index into a 3D texture, but I prefer the above.\n        vec3 refl = texture(iChannel2, normalize(reflect(r, svn*.5 + n*.5))).xyz;\n        vec3 refr = texture(iChannel2, normalize(refract(r, svn*.5 + n*.5, 1./1.31))).xyz;\n        refl *= refl*.5;\n        refr *= refr*.5;\n        */\n        \n        // More fake physics that looks like real physics. :) Mixing the reflection and refraction \n        // colors according to a Fresnel variation.\n        vec3 refCol = mix(refr, refl, pow(fr, 5.)); //(refr + refl)*.5; // Adding them, if preferred.\n        \n        // Obviously, the reflected\\refracted colors will involve lit values from their respective\n        // hit points, but this is fake, so we're just combining it with a portion of the surface \n        // diffuse value.\n        col += refCol*((di*di*.25+.75) + ao*.25)*1.5; // Add the reflected color. You could combine it in other ways too.\n        \n        // Based on IQ's suggestion: Using the diffuse setting to vary the color slightly in the\n        // hope that it adds a little more depth. It also gives the impression that Beer's Law is \n        // taking effect, even though it clearly isn't. I might try to vary with curvature - or some other\n        // depth guage - later to see if it makes a difference.\n        col = mix(col.xzy, col, di*.85 + .15); \n        \n        // Glow.\n        // Taking the accumulated color (see the raymarching function), tweaking it to look a little\n        // hotter, then combining it with the object color.\n        vec3 accCol = vec3(1, .3, .1)*accum;\n        vec3 gc = pow(min(vec3(1.5, 1, 1)*accum, 1.), vec3(1, 2.5, 12.))*.5 + accCol*.5;\n        col += col*gc*12.;\n        \n        \n        // Purple electric charge.\n        float hi = abs(mod(t/1. + iTime/3., 8.) - 8./2.)*2.;\n        vec3 cCol = vec3(.01, .05, 1)*col*1./(.001 + hi*hi*.2);\n        col += mix(cCol.yxz, cCol, n3D(p*3.));\n \t\t// Similar effect.\n        //vec3 cCol = vec3(.01, .05, 1)*col*abs(tan(t/1.5 + iTime/3.));\n        //col += cCol;\n \n        \n        // Apply some shading.\n        col *= ao*sh*at;\n\n        \n    }\n    \n    \n    // Blend in a bit of light fog for atmospheric effect.\n    vec3 fog = vec3(.125, .04, .05)*(r.y*.5 + .5);    \n    col = mix(col, fog, smoothstep(0., .95, t/FAR)); // exp(-.002*t*t), etc. fog.zxy\n\n    \n    // Subtle vignette.\n    u = fragCoord/iResolution.xy;\n    col = mix(vec3(0), col, pow( 16.0*u.x*u.y*(1.0-u.x)*(1.0-u.y) , .125)*.5 + .5);\n\n \n    \n    // Rough gamma correction, and we're done.\n    fragColor = vec4(sqrt(clamp(col, 0., 1.)), 1);\n    \n    \n}",
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
          "id": "4ttGDH",
          "date": "1490104585",
          "viewed": 22128,
          "name": "Abstract Glassy Field",
          "username": "Shane",
          "description": "An abstract, blobby-looking field - rendered in the style of hot, glowing, fluid-filled glass. All produced using cheap low-budget pseudoscience. :)",
          "likes": 301,
          "published": 3,
          "flags": 0,
          "usePreview": 0,
          "tags": [
            "raymarch",
            "refraction",
            "glass",
            "blob",
            "glow",
            "field",
            "hot"
          ],
          "hasliked": 1,
          "parentid": "",
          "parentname": ""
        }
      }
];

compileAndStart(jsnShader);