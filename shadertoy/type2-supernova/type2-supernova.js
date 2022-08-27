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
                  "filter": "linear",
                  "wrap": "repeat",
                  "vflip": "false",
                  "srgb": "false",
                  "internal": "byte"
                }
              },
              {
                "channel": 1,
                "type": "keyboard",
                "id": "4dXGRr",
                "filepath": "/presets/tex00.jpg",
                "sampler": {
                  "filter": "linear",
                  "wrap": "clamp",
                  "vflip": "true",
                  "srgb": "false",
                  "internal": "byte"
                }
              },
              {
                "channel": 2,
                "type": "texture",
                "id": "4sf3Rn",
                "filepath": "/media/a/0a40562379b63dfb89227e6d172f39fdce9022cba76623f1054a2c83d6c0ba5d.png",
                "sampler": {
                  "filter": "linear",
                  "wrap": "repeat",
                  "vflip": "false",
                  "srgb": "false",
                  "internal": "byte"
                }
              }
            ],
            "code": "// \"Type 2 Supernova\" by Duke\n// https://www.shadertoy.com/view/lsyXDK\n// VR ready version of this shader is here https://www.shadertoy.com/view/XdKSDV (thanks RavenWorks for help)\n//-------------------------------------------------------------------------------------\n// Based on \"Supernova remnant\" (https://www.shadertoy.com/view/MdKXzc)\n// \"Volumetric explosion\" (https://www.shadertoy.com/view/lsySzd)\n// otaviogood's \"Alien Beacon\" (https://www.shadertoy.com/view/ld2SzK)\n// Shane's \"Cheap Cloud Flythrough\" (https://www.shadertoy.com/view/Xsc3R4) shaders\n// Some ideas came from other shaders from this wonderful site\n// Press 1-2-3 to zoom in and zoom out.\n// License: Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License\n//-------------------------------------------------------------------------------------\n\n#define DITHERING\n#define BACKGROUND\n\n//#define TONEMAPPING\n\n//-------------------\n#define pi 3.14159265\n#define R(p, a) p=cos(a)*p+sin(a)*vec2(p.y, -p.x)\n\n// iq's noise\nfloat noise( in vec3 x )\n{\n    vec3 p = floor(x);\n    vec3 f = fract(x);\n\tf = f*f*(3.0-2.0*f);\n\tvec2 uv = (p.xy+vec2(37.0,17.0)*p.z) + f.xy;\n\tvec2 rg = textureLod( iChannel0, (uv+ 0.5)/256.0, 0.0 ).yx;\n\treturn 1. - 0.82*mix( rg.x, rg.y, f.z );\n}\n\nfloat fbm( vec3 p )\n{\n   return noise(p*.06125)*.5 + noise(p*.125)*.25 + noise(p*.25)*.125 + noise(p*.4)*.2;\n}\n\nfloat Sphere( vec3 p, float r )\n{\n    return length(p)-r;\n}\n\n//==============================================================\n// otaviogood's noise from https://www.shadertoy.com/view/ld2SzK\n//--------------------------------------------------------------\n// This spiral noise works by successively adding and rotating sin waves while increasing frequency.\n// It should work the same on all computers since it's not based on a hash function like some other noises.\n// It can be much faster than other noise functions if you're ok with some repetition.\nconst float nudge = 4.;\t// size of perpendicular vector\nfloat normalizer = 1.0 / sqrt(1.0 + nudge*nudge);\t// pythagorean theorem on that perpendicular to maintain scale\nfloat SpiralNoiseC(vec3 p)\n{\n    float n = 1.-mod(iTime * 0.1,-1.); // noise amount\n    float iter = 2.0;\n    for (int i = 0; i < 8; i++)\n    {\n        // add sin and cos scaled inverse with the frequency\n        n += -abs(sin(p.y*iter) + cos(p.x*iter)) / iter;\t// abs for a ridged look\n        // rotate by adding perpendicular and scaling down\n        p.xy += vec2(p.y, -p.x) * nudge;\n        p.xy *= normalizer;\n        // rotate on other axis\n        p.xz += vec2(p.z, -p.x) * nudge;\n        p.xz *= normalizer;\n        // increase the frequency\n        iter *= 1.733733;\n    }\n    return n;\n}\n\nfloat VolumetricExplosion(vec3 p)\n{\n    float final = Sphere(p,4.);\n    final += noise(p*20.)*.4;\n    final += SpiralNoiseC(p.zxy*fbm(p*10.))*2.5; //1.25;\n\n    return final;\n}\n\nfloat map(vec3 p) \n{\n\tR(p.xz, iMouse.x*0.008*pi+iTime*0.1);\n\n\tfloat VolExplosion = VolumetricExplosion(p/(1.+mod(iTime * 0.1,-1.)))*(1.+mod(iTime * 0.1,-1.)); // scale\n    \n\treturn abs(VolExplosion)+0.07;\n}\n//--------------------------------------------------------------\n\n// assign color to the media\nvec3 computeColor( float density, float radius )\n{\n\t// color based on density alone, gives impression of occlusion within\n\t// the media\n\tvec3 result = mix( vec3(1.0,0.9,0.8), vec3(0.4,0.15,0.1), density );\n\t\n\t// color added to the media\n\tvec3 colCenter = 7.*vec3(0.8,1.0,1.0);\n\tvec3 colEdge = 1.5*vec3(0.48,0.53,0.5);\n\tresult *= mix( colCenter, colEdge, min( (radius+.05)/.9, 1.15 ) );\n\t\n\treturn result;\n}\n\nbool RaySphereIntersect(vec3 org, vec3 dir, out float near, out float far)\n{\n\tfloat b = dot(dir, org);\n\tfloat c = dot(org, org) - 8.;\n\tfloat delta = b*b - c;\n\tif( delta < 0.0) \n\t\treturn false;\n\tfloat deltasqrt = sqrt(delta);\n\tnear = -b - deltasqrt;\n\tfar = -b + deltasqrt;\n\treturn far > 0.0;\n}\n\n// Applies the filmic curve from John Hable's presentation\n// More details at : http://filmicgames.com/archives/75\nvec3 ToneMapFilmicALU(vec3 _color)\n{\n\t_color = max(vec3(0), _color - vec3(0.004));\n\t_color = (_color * (6.2*_color + vec3(0.5))) / (_color * (6.2 * _color + vec3(1.7)) + vec3(0.06));\n\treturn pow(_color, vec3(2.2));\n}\n\nvoid mainImage( out vec4 fragColor, in vec2 fragCoord )\n{  \n    const float KEY_1 = 49.5/256.0;\n\tconst float KEY_2 = 50.5/256.0;\n\tconst float KEY_3 = 51.5/256.0;\n    float key = 0.0;\n    key += 0.7*texture(iChannel1, vec2(KEY_1,0.25)).x;\n    key += 0.7*texture(iChannel1, vec2(KEY_2,0.25)).x;\n    key += 0.7*texture(iChannel1, vec2(KEY_3,0.25)).x;\n\n    vec2 uv = fragCoord/iResolution.xy;\n    \n\t// ro: ray origin\n\t// rd: direction of the ray\n\tvec3 rd = normalize(vec3((fragCoord.xy-0.5*iResolution.xy)/iResolution.y, 1.));\n\tvec3 ro = vec3(0., 0., -6.+key*1.6);\n    \n\t// ld, td: local, total density \n\t// w: weighting factor\n\tfloat ld=0., td=0., w=0.;\n\n\t// t: length of the ray\n\t// d: distance function\n\tfloat d=1., t=0.;\n    \n    const float h = 0.1;\n   \n\tvec4 sum = vec4(0.0);\n   \n    float min_dist=0.0, max_dist=0.0;\n\n    if(RaySphereIntersect(ro, rd, min_dist, max_dist))\n    {\n       \n\tt = min_dist*step(t,min_dist);\n   \n\t// raymarch loop\n    for (int i=0; i<86; i++)\n\t{\n\t \n\t\tvec3 pos = ro + t*rd;\n  \n\t\t// Loop break conditions.\n\t    if(td>0.9 || d<0.11*t || t>10. || sum.a > 0.99 || t>max_dist) break;\n        \n        // evaluate distance function\n        float d = map(pos);\n        \n        // point light calculations\n        vec3 ldst = vec3(0.0)-pos;\n        float lDist = max(length(ldst), 0.001);\n\n        // the color of light \n        vec3 lightColor=vec3(1.0,0.5,0.25);\n        \n        sum.rgb+=(vec3(0.67,0.75,1.00)/(lDist*lDist*15.)/100.); // star itself\n        sum.rgb+=(lightColor/exp(lDist*lDist*lDist*.08)/30.); // bloom\n        \n\t\tif (d<h) \n\t\t{\n\t\t\t// compute local density \n\t\t\tld = h - d;\n            \n            // compute weighting factor \n\t\t\tw = (1. - td) * ld;\n     \n\t\t\t// accumulate density\n\t\t\ttd += w + 1./200.;\n\t\t\n\t\t\tvec4 col = vec4( computeColor(td,lDist), td );\n            \n            // emission\n            sum += sum.a * vec4(sum.rgb, 0.0) * 0.2 / lDist;\t\n            \n\t\t\t// uniform scale density\n\t\t\tcol.a *= 0.2;\n\t\t\t// colour by alpha\n\t\t\tcol.rgb *= col.a;\n\t\t\t// alpha blend in contribution\n\t\t\tsum = sum + col*(1.0 - sum.a);  \n       \n\t\t}\n      \n\t\ttd += 1./70.;\n\n        #ifdef DITHERING\n        // idea from https://www.shadertoy.com/view/lsj3Dw\n        vec2 uvd = uv;\n        uvd.y*=120.;\n        uvd.x*=280.;\n        d=abs(d)*(.8+0.08*texture(iChannel2,vec2(uvd.y,-uvd.x+0.5*sin(4.*iTime+uvd.y*4.0))).r);\n        #endif \n\t\t\n        // trying to optimize step size\n        t += max(d * 0.1 * max(min(length(ldst),length(ro)),0.1), 0.01);\n\n\t}\n    \n    // simple scattering\n    sum *= 1. / exp( ld * 0.2 ) * 0.8;\n        \n   \tsum = clamp( sum, 0.0, 1.0 );\n   \n    sum.xyz = sum.xyz*sum.xyz*(3.0-2.0*sum.xyz);\n    \n\t}\n    \n    #ifdef BACKGROUND\n    // stars background\n    if (td<.8)\n    {\n        vec3 stars = vec3(noise(rd*500.0)*0.5+0.5);\n        vec3 starbg = vec3(0.0);\n        starbg = mix(starbg, vec3(0.8,0.9,1.0), smoothstep(0.99, 1.0, stars)*clamp(dot(vec3(0.0),rd)+0.75,0.0,1.0));\n        starbg = clamp(starbg, 0.0, 1.0);\n        sum.xyz += starbg; \n    }\n\t#endif\n   \n    #ifdef TONEMAPPING\n    fragColor = vec4(ToneMapFilmicALU(sum.xyz),1.0);\n\t#else\n    fragColor = vec4(sum.xyz,1.0);\n\t#endif\n}",
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
          "mFlagKeyboard": true,
          "mFlagMultipass": false,
          "mFlagMusicStream": false
        },
        "info": {
          "id": "lsyXDK",
          "date": "1466613445",
          "viewed": 6426,
          "name": "Type 2 Supernova",
          "username": "Duke",
          "description": "Finally I found the time to finish this shader. It is a combination of [url=https://www.shadertoy.com/view/MdKXzc]Supernova remnant[/url] and [url=https://www.shadertoy.com/view/lsySzd]Volumetric explosion[/url] shaders.",
          "likes": 115,
          "published": 3,
          "flags": 16,
          "usePreview": 1,
          "tags": [
            "cloud",
            "explosion",
            "volumetric",
            "nebula",
            "supernova",
            "dust",
            "remnant",
            "filament"
          ],
          "hasliked": 1,
          "parentid": "",
          "parentname": ""
        }
      }
];

compileAndStart(jsnShader);