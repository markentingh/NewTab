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
                "id": "XsX3Rn",
                "filepath": "/media/a/92d7758c402f0927011ca8d0a7e40251439fba3a1dac26f5b8b62026323501aa.jpg",
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
                "type": "texture",
                "id": "XdX3Rn",
                "filepath": "/media/a/52d2a8f514c4fd2d9866587f4d7b2a5bfa1a11a0e772077d7682deb8b3b517e5.jpg",
                "sampler": {
                  "filter": "mipmap",
                  "wrap": "repeat",
                  "vflip": "false",
                  "srgb": "false",
                  "internal": "byte"
                }
              },
              {
                "channel": 2,
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
                "channel": 3,
                "type": "texture",
                "id": "XdfGRn",
                "filepath": "/media/a/e6e5631ce1237ae4c05b3563eda686400a401df4548d0f9fad40ecac1659c46c.jpg",
                "sampler": {
                  "filter": "mipmap",
                  "wrap": "repeat",
                  "vflip": "false",
                  "srgb": "false",
                  "internal": "byte"
                }
              }
            ],
            "code": "// Neptune Racing. December 2014\n// https://www.shadertoy.com/view/XtX3Rr\n\n\n// Uses sphere tracing to accumulate direction normals across the landscape.\n// Materials are calculated after the tracing loop from alphas and distances\n// stored in a stack.\n// Change ScoopRadius for depth of field.\n\n#define PI 3.141596\nvec3 sunLight  = normalize( vec3(  0.35, 0.2,  0.3 ) );\nvec3 moon  = vec3(  45000., 30000.0,  -30000. );\nconst vec3 sunColour = vec3(.4, .6, 1.);\n#define FOG_COLOUR vec3(0.07, 0.05, 0.05)\nvec4 aStack[2];\nvec4 dStack[2];\nvec2 fcoord;\n\n\n//--------------------------------------------------------------------------\nfloat Hash(vec2 p)\n{\n\treturn fract(sin(dot(p, vec2(12.9898, 78.233))) * 33758.5453)-.5;\n}\n\n//--------------------------------------------------------------------------\nfloat Noise(in vec3 x)\n{\n    vec3 p = floor(x);\n    vec3 f = fract(x);\n\tf = f*f*(3.0-2.0*f);\n\tvec2 uv = (p.xy+vec2(37.0,17.0)*p.z) + f.xy;\n\tvec2 rg = textureLod( iChannel2, (uv+ 0.5)/256.0, 0.0 ).yx;\n\n\treturn mix( rg.x, rg.y, f.z );\n}\n\n//-----------------------------------------------------------------------------------\nconst mat3 m = mat3( 0.00,  0.80,  0.60,\n                    -0.80,  0.46, -0.48,\n                    -0.60, -0.38,  0.64 ) * 2.43;\nfloat Turbulence( vec3 p )\n{\n    float f;\n    f  = 0.5000*Noise( p ); p = m*p;\n    f += 0.2500*Noise( p ); p = m*p;\n    f += 0.1250*Noise( p ); p = m*p;\n    f += 0.0625*Noise( p ); p = m*p;\n    f += 0.0312*Noise( p ); \n\treturn f;\n}\n\n//--------------------------------------------------------------------------\nfloat SphereIntersect( in vec3 ro, in vec3 rd, in vec4 sph )\n{\n\tvec3 oc = ro - sph.xyz;\n\tfloat b = dot( oc, rd );\n\tfloat c = dot( oc, oc ) - sph.w*sph.w;\n\tfloat h = b*b - c;\n\tif( h<0.0 ) return -1.0;\n\treturn -b - sqrt( h );\n}\n\n//-----------------------------------------------------------------------------------\nfloat Terrain( in vec2 q, float bias )\n{\n\tfloat tx1 = smoothstep( 0.,.4, textureLod( iChannel0, 0.000015*q, bias ).y);\n    tx1   = mix(tx1, textureLod( iChannel1, 0.00003*q, bias ).x, tx1);\n\treturn tx1*355.0;\n}\n\n\n//--------------------------------------------------------------------------\nfloat Map( in vec3 p )\n{\n\tfloat h = Terrain( p.xz, -100.0 );\n\tfloat  turb =Turbulence( p * vec3(1.0, 1., 1.0)*.05 ) * 25.3;\n\treturn p.y-h+turb;\n}\n//--------------------------------------------------------------------------\n// Grab all sky information for a given ray from camera\nvec3 GetSky(in vec3 rd)\n{\n\tfloat sunAmount = max( dot( rd, sunLight), 0.0 );\n\tfloat v = pow(1.0-max(rd.y,0.0),4.);\n\tvec3  sky = mix(vec3(.0,0.01,.04), vec3(.1, .04, .07), v);\n\t//sky *= smoothstep(-0.3, .0, rd.y);\n\tsky = sky + sunColour * sunAmount * sunAmount * .15;\n\tsky = sky + sunColour * min(pow(sunAmount, 1800.0), .3);\n\treturn clamp(sky, 0.0, 1.0);\n}\n//--------------------------------------------------------------------------\n vec3 GetClouds(vec3 p,vec3 dir)\n {\n    float n = (1900.0-p.y)/dir.y;\n    vec2 p2 = p.xz + dir.xz * n;\n    vec3 clo = textureLod(iChannel3, p2*.00001+.2,0.).zyz * .04;\n\tn = (1000.0-p.y)/dir.y;\n\tp2 = p.xz + dir.xz * n;\n    clo += textureLod(iChannel0, p2*.00001-.4, 0.0).zyz * .04;\n    clo = clo * pow(max(dir.y, 0.0), .8)*3.0;\n     return clo;\n\n }\n\n//--------------------------------------------------------------------------\nfloat ScoopRadius(float t)\n{\n\tt = abs(t-150.) * 1.;\n\tt = t*0.006;\n\treturn clamp(t*t, 256.0/iResolution.y, 20000.0/iResolution.y);\n}\n\n//--------------------------------------------------------------------------\n// Calculate sun light...\nvec3 DoLighting(in vec3 mat, in vec3 normal, in vec3 eyeDir, in float d,in vec3 sky)\n{\n\tfloat h = dot(sunLight,normal);\n\tmat = mat * sunColour*(max(h, 0.0));\n\tmat += vec3(0.01, .01,.02) * max(normal.y, 0.0);\n    normal = reflect(eyeDir, normal);\n    mat += pow(max(dot(sunLight, normal), 0.0), 50.0)  * sunColour * .5;\n    mat = mix(sky,mat, min(exp(-d*d*.000002), 1.0));\n\treturn mat;\n}\n\n//--------------------------------------------------------------------------\nvec3 GetNormal(vec3 p, float sphereR)\n{\n\tvec2 eps = vec2(sphereR*.5, 0.0);\n\treturn normalize( vec3(\n           Map(p+eps.xyy) - Map(p-eps.xyy),\n           Map(p+eps.yxy) - Map(p-eps.yxy),\n           Map(p+eps.yyx) - Map(p-eps.yyx) ) );\n}\n\n//--------------------------------------------------------------------------\nfloat Scene(in vec3 rO, in vec3 rD)\n{\n    //float t = 0.0;\n\tfloat t = 8.0 * Hash(fcoord);\n\tfloat  alphaAcc = 0.0;\n\tvec3 p = vec3(0.0);\n    int hits = 0;\n\n\tfor( int j=0; j < 95; j++ )\n\t{\n\t\tif (hits == 8  || t > 1250.0) break;\n\t\tp = rO + t*rD;\n\t\tfloat sphereR = ScoopRadius(t);\n\t\tfloat h =Map(p);\n\t\tif(h < sphereR)\n\t\t{\n\t\t\t// Accumulate the alphas...\n\t\t\tfloat alpha = (1.0 - alphaAcc) * min(((sphereR-h) / sphereR), 1.0);\n            // If high enough to contribute nicely...\n            if (alpha > (1./8.0))\n            {\n\t\t\t\t// If a peice of the lanscape is scooped as a suitable alpha,\n                // then it's put on the stacks...\n\t\t\t// put it on the 2 stacks, alpha and distance...\n                aStack[1].yzw = aStack[1].xyz; aStack[1].x = aStack[0].w;\n                aStack[0].yzw = aStack[0].xyz; aStack[0].x = alpha;\n                dStack[1].yzw = dStack[1].xyz; dStack[1].x = dStack[0].w;\n                dStack[0].yzw = dStack[0].xyz; dStack[0].x = t;\n                alphaAcc += alpha;\t\n                hits++;\n            }\n            \n\t\t}\n\t\tt +=  h * .5 + t * 0.004;\n       \n\t}\n    \n\treturn clamp(alphaAcc, 0.0, 1.0);\n}\n\n\n\n\n\n//--------------------------------------------------------------------------\nvec3 PostEffects(vec3 rgb, vec2 xy)\n{\n\t// Gamma first...\n\trgb = pow(rgb, vec3(0.45));\n\n\t// Then...\n\t#define CONTRAST 1.1\n\t#define SATURATION 1.4\n\t#define BRIGHTNESS 1.2\n\trgb = mix(vec3(.5), mix(vec3(dot(vec3(.2125, .7154, .0721), rgb*BRIGHTNESS)), rgb*BRIGHTNESS, SATURATION), CONTRAST);\n\n\t// Vignette...\n\trgb *= .5+0.5*pow(180.0*xy.x*xy.y*(1.0-xy.x)*(1.0-xy.y), 0.3 );\t\n\n\treturn clamp(rgb, 0.0, 1.0);\n}\n\n//--------------------------------------------------------------------------\nvec3 TexCube( sampler2D sam, in vec3 p, in vec3 n )\n{\n\tvec3 x = texture( sam, p.yz ).xyz;\n\tvec3 y = texture( sam, p.zx ).xyz;\n\tvec3 z = texture( sam, p.xy ).xyz;\n\treturn (x*abs(n.x) + y*abs(n.y) + z*abs(n.z))/(abs(n.x)+abs(n.y)+abs(n.z));\n}\n//--------------------------------------------------------------------------\nvec3 Albedo(vec3 pos, vec3 nor)\n{\n    vec3 col = TexCube(iChannel1, pos*.01, nor).xzy + TexCube(iChannel3, pos*.02, nor);\n    return col * .5;\n}\n\n//--------------------------------------------------------------------------\n float cross2(vec2 A, vec2 B)\n {\n\treturn A.x*B.y-A.y*B.x;\n }\n\n//--------------------------------------------------------------------------\n// Angle between 2 vectors...\n float GetAngle(vec2 A, vec2 B)\n {\n\treturn atan(cross2(A,B), dot(A,B));\n    //return  atan(B.y, B.x) - atan(A.y, A.x);\n    //return (acos((A.x * B.x + A.y * B.y)/((sqrt(A.x*A.x + A.y*A.y) * sqrt(B.x*B.x + B.y*B.y))))/3.141);\n}\n\n//--------------------------------------------------------------------------\nvec3 CameraPath( float t )\n{\n    float s = smoothstep(.0, 3.0, t);\n\tvec3 pos = vec3( t*30.0*s +120.0, 1.0, t* 220.* s -80.0);\n\t\n\tfloat a = t/4.0;\n\tpos.xz += vec2(1350.0 * cos(a), 350.0*sin(a));\n    pos.xz += vec2(1400.0 * sin(-a*1.8), 400.0*cos(-a*4.43));\n\n\treturn pos;\n} \n\n//--------------------------------------------------------------------------\nvoid mainImage( out vec4 fragColor, in vec2 fragCoord )\n{\n    fcoord = fragCoord;\n\tfloat m = 0.0;//(iMouse.x/iResolution.x)*10.0;\n\tfloat gTime = ((iTime+135.0)*.25+m);\n    vec2 xy = fragCoord.xy / iResolution.xy;\n\tvec2 uv = (-1.0 + 2.0 * xy) * vec2(iResolution.x/iResolution.y,1.0);\n\t\n\tfloat hTime = mod(gTime+1.95, 2.0);\n\t\n\tvec3 cameraPos \t= CameraPath(gTime + 0.0);\n\tvec3 camTarget \t= CameraPath(gTime + .25);\n    vec3 far\t \t= CameraPath(gTime + .5);\n    \n\n    vec2 v1 = (far.xz-cameraPos.xz);\n    vec2 v2 = (camTarget.xz-cameraPos.xz);\n    float roll = clamp(GetAngle(v1 , v2)*2., -.9, .9  );\n    \n    \n\tfloat t = Terrain(cameraPos.xz, .0)+13.0;\n    float t2 = Terrain(camTarget.xz, .0)+13.0;\n    cameraPos.y = camTarget.y= t;\n\t\n\t//roll = roll;\n\tvec3 cw = normalize(camTarget-cameraPos);\n\tvec3 cp = vec3(sin(roll), cos(roll),0.0);\n\tvec3 cu = normalize(cross(cw,cp));\n\tvec3 cv = normalize(cross(cu,cw));\n\tvec3 dir = normalize(uv.x*cu + uv.y*cv + 1.1*cw);\n\n\tvec3 col = vec3(0.0);\n\t\n    for (int i = 0; i <2; i++)\n    {\n\t\tdStack[i] = vec4(-20.0);\n        aStack[i] = vec4(0.0);\n    }\n\tfloat alpha = Scene(cameraPos, dir);\n\t\n     vec3 sky = GetSky(dir);\n    // Render both stacks...\n    for (int s = 0; s < 2; s++)\n    {\n        for (int i = 0; i < 4; i++)\n\t\t{\n            float d = dStack[s][i];\n            if (d < .0) continue;\n            float sphereR = ScoopRadius(d);\n            vec3 pos = cameraPos + dir * d;\n            float occ = max(1.2-Turbulence(pos * vec3(1.0, 1., 1.0)*.05 )*1.2, 0.0);\n            vec3 normal = GetNormal(pos, sphereR);\n            vec3 c = Albedo(pos, normal);\n\t\t\tcol += DoLighting(c, normal, dir, d, sky)* aStack[s][i]*occ;\n        }\n    }\n    \n   col += sky *  (1.0-alpha);\n    \n    if (alpha < .8)\n    {\n        // Do a quick moon...\n        float t = SphereIntersect(cameraPos, dir, vec4(moon, 14000.0));\n        if (t> 0.0)\n        {\n            vec3 moo = cameraPos + t * dir;\n            vec3 nor = normalize(moo-moon);\n            moo = TexCube(iChannel3, moo*.00001, nor)* max(dot(sunLight, nor), 0.0);\n            \n            sky = mix(sky, moo, .2);\n        }\n        else\n        {\n            float stars = pow(texture(iChannel2, vec2(atan(dir.x, dir.z), dir.y*2.0), -100.0).x, 48.0)*.35;\n            stars *= pow(max(dir.y, 0.0), .8)*2.0;\n            sky += stars;\n        }\n        sky += GetClouds(cameraPos, dir);\n\t\tcol = mix(sky ,col, alpha);\n    }\n\n\tcol = PostEffects(col, xy) * smoothstep(.0, 2.0, iTime);\t\n\t\n\tfragColor=vec4(col,1.0);\n}\n",
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
          "id": "XtX3Rr",
          "date": "1417633586",
          "viewed": 24977,
          "name": "Neptune Racing",
          "username": "Dave_Hoskins",
          "description": "Another landscape. This time using a stack of 8 distance field sphere scoops, enabling anti-aliasing and DOF.\n\nThanks to vgs ([url]https://www.shadertoy.com/view/MdBSDt[/url]) for the stack idea.",
          "likes": 207,
          "published": 3,
          "flags": 8,
          "usePreview": 0,
          "tags": [
            "3d",
            "raymarching",
            "antialiasing",
            "fov",
            "neptuneracing"
          ],
          "hasliked": 1,
          "parentid": "",
          "parentname": ""
        }
      }
];

compileAndStart(jsnShader);