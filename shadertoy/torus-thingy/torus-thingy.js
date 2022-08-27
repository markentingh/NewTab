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
            "inputs": [],
            "code": "/*\n* License Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License.\n* Created by bal-khan\n*/\n\nvec2\tmarch(vec3 pos, vec3 dir);\nvec3\tcamera(vec2 uv);\nvoid\trotate(inout vec2 v, float angle);\n\nfloat \tt;\t\t\t// time\nvec3\tret_col;\t// torus color\nvec3\th; \t\t\t// light amount\n\n#define I_MAX\t\t400.\n#define E\t\t\t0.00001\n#define FAR\t\t\t50.\n#define PI\t\t\t3.14\n\n// blackbody by aiekick : https://www.shadertoy.com/view/lttXDn\n\n// -------------blackbody----------------- //\n\n// return color from temperature \n//http://www.physics.sfasu.edu/astro/color/blackbody.html\n//http://www.vendian.org/mncharity/dir3/blackbody/\n//http://www.vendian.org/mncharity/dir3/blackbody/UnstableURLs/bbr_color.html\n\nvec3 blackbody(float Temp)\n{\n\tvec3 col = vec3(255.);\n    col.x = 56100000. * pow(Temp,(-3. / 2.)) + 148.;\n   \tcol.y = 100.04 * log(Temp) - 623.6;\n   \tif (Temp > 6500.) col.y = 35200000. * pow(Temp,(-3. / 2.)) + 184.;\n   \tcol.z = 194.18 * log(Temp) - 1448.6;\n   \tcol = clamp(col, 0., 255.)/255.;\n    if (Temp < 1000.) col *= Temp/1000.;\n   \treturn col;\n}\n\n// -------------blackbody----------------- //\n\nvoid mainImage(out vec4 c_out, in vec2 f)\n{\n    t  = iTime*.125;\n    vec3\tcol = vec3(0., 0., 0.);\n\tvec2 R = iResolution.xy,\n          uv  = vec2(f-R/2.) / R.y;\n\tvec3\tdir = camera(uv);\n    vec3\tpos = vec3(.0, .0, 0.0);\n\n    pos.z = 4.5+1.5*sin(t*10.);    \n    h*=0.;\n    vec2\tinter = (march(pos, dir));\n    col.xyz = ret_col*(1.-inter.x*.0125);\n    col += h * .4;\n    c_out =  vec4(col,1.0);\n}\n\nfloat\tscene(vec3 p)\n{  \n    float\tvar;\n    float\tmind = 1e5;\n    p.z += 10.;\n    \n    rotate(p.xz, 1.57-.5*iTime );\n    rotate(p.yz, 1.57-.5*iTime );\n    var = atan(p.x,p.y);\n    vec2 q = vec2( ( length(p.xy) )-6.,p.z);\n    rotate(q, var*.25+iTime*2.*0.);\n    vec2 oq = q ;\n    q = abs(q)-2.5;\n    if (oq.x < q.x && oq.y > q.y)\n    \trotate(q, ( (var*1.)+iTime*0.)*3.14+iTime*0.);\n    else\n        rotate(q, ( .28-(var*1.)+iTime*0.)*3.14+iTime*0.);\n    ret_col = 1.-vec3(.350, .2, .3);\n    mind = length(q)+.5+1.05*(length(fract(q*.5*(3.+3.*sin(var*1. - iTime*2.)) )-.5)-1.215);\n    h -= vec3(-3.20,.20,1.0)*vec3(1.)*.0025/(.051+(mind-sin(var*1. - iTime*2. + 3.14)*.125 )*(mind-sin(var*1. - iTime*2. + 3.14)*.125 ) );\n    h -= vec3(1.20,-.50,-.50)*vec3(1.)*.025/(.501+(mind-sin(var*1. - iTime*2.)*.5 )*(mind-sin(var*1. - iTime*2.)*.5 ) );\n    h += vec3(.25, .4, .5)*.0025/(.021+mind*mind);\n    \n    return (mind);\n}\n\nvec2\tmarch(vec3 pos, vec3 dir)\n{\n    vec2\tdist = vec2(0.0, 0.0);\n    vec3\tp = vec3(0.0, 0.0, 0.0);\n    vec2\ts = vec2(0.0, 0.0);\n\n\t    for (float i = -1.; i < I_MAX; ++i)\n\t    {\n\t    \tp = pos + dir * dist.y;\n\t        dist.x = scene(p);\n\t        dist.y += dist.x*.2; // makes artefacts disappear\n            // log trick by aiekick\n\t        if (log(dist.y*dist.y/dist.x/1e5) > .0 || dist.x < E || dist.y > FAR)\n            {\n                break;\n            }\n\t        s.x++;\n    }\n    s.y = dist.y;\n    return (s);\n}\n\n// Utilities\n\nvoid rotate(inout vec2 v, float angle)\n{\n\tv = vec2(cos(angle)*v.x+sin(angle)*v.y,-sin(angle)*v.x+cos(angle)*v.y);\n}\n\nvec3\tcamera(vec2 uv)\n{\n    float\t\tfov = 1.;\n\tvec3\t\tforw  = vec3(0.0, 0.0, -1.0);\n\tvec3    \tright = vec3(1.0, 0.0, 0.0);\n\tvec3    \tup    = vec3(0.0, 1.0, 0.0);\n\n    return (normalize((uv.x) * right + (uv.y) * up + fov * forw));\n}\n",
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
          "id": "lt2fDz",
          "date": "1515612374",
          "viewed": 10796,
          "name": "Torus_Thingy_8",
          "username": "balkhan",
          "description": "Another one",
          "likes": 184,
          "published": 1,
          "flags": 0,
          "usePreview": 0,
          "tags": [
            "3d",
            "torus",
            "trivialknot"
          ],
          "hasliked": 1,
          "parentid": "",
          "parentname": ""
        }
      }
];

compileAndStart(jsnShader);