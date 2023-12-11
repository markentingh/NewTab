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
            "code": "vec4 sun(vec2 uv, float time)\n{\n    vec3 sunUp = vec3(250.0/255.0, 242.0/255.0, 0.0);\n    vec3 sunDown = vec3(252.0/255.0, 0.0, 140.0/255.0);\n    //float sunTopPosition = 0.\n    float gapSize = 0.2;\n    float gapFrequency = 0.03;\n    float sunSize = 0.19;\n    float gapSpeed = 0.007;\n    if (length(uv + vec2(0.0, -0.05)) < sunSize\n        && mod(uv.y + time*gapSpeed, gapFrequency) > gapSize * gapFrequency)\n    {\n        return vec4(mix(sunUp, sunDown, 1.1 - (uv.y / 0.4 + 0.5)), 1.0);\n    }\n    return vec4(0.0);\n}\n\nvec4 sunOcclusion(vec2 uv, float time)\n{\n    vec3 sunUp = vec3(250.0/255.0, 242.0/255.0, 0.0);\n    vec3 sunDown = vec3(252.0/255.0, 0.0, 140.0/255.0);\n    //float sunTopPosition = 0.\n    float gapSize = 0.2;\n    float gapFrequency = 0.03;\n    float sunSize = 0.19;\n    float gapSpeed = 0.007;\n    if (length(uv + vec2(0.0, -0.05)) < sunSize\n        /*&& mod(uv.y + time*gapSpeed, gapFrequency) > gapSize * gapFrequency*/)\n    {\n        return vec4(mix(sunUp, sunDown, 1.1 - (uv.y / 0.4 + 0.5)), 1.0);\n    }\n    return vec4(0.0);\n}\n\nvec4 neonFloor(vec2 uv, float time, float beat)\n{\n    float t = time * 0.5 + beat;\n    vec3 baseFloor = vec3(10.0/255.0, 26.0/255.0, 48.0/255.0);\n    vec3 lightFloor = vec3(208.0/255.0, 0.0/255.0, 255.0/255.0);\n    if (uv.y < -0.06)\n    {\n        if (mod(uv.x / uv.y + sin(t), 1.1) < 0.05)\n        {\n            return vec4(lightFloor, 1.0);\n        }\n        \n        if (mod((uv.y + 0.5) / (uv.y - 0.05) - t, 0.4) < 0.2*-uv.y) {\n            return vec4(lightFloor, 1.0);\n        }\n        return vec4(baseFloor, 1.0);\n    }\n    return vec4(0.0);\n}\n\nvec4 middleGlow(vec2 uv, float time)\n{\n    float middlePoint = -0.06; // Modified uv\n    float dist = abs(uv.y - middlePoint);\n    float radialDist = length(uv*vec2(0.02, 1.0) - vec2(0.0, middlePoint));\n    //return vec4(111.0/255.0, 0.0/255.0, 255.0/255.0, clamp(1.0 - dist*9.0, 0.0, 1.0)) * 0.6\n    //    + vec4(1.0, 1.0, 1.0, clamp(1.0 - dist*20.0, 0.0, 1.0))*0.6;\n    vec4 col = vec4(111.0/255.0, 0.0/255.0, 255.0/255.0, 1.0 - dist*4.0);\n    col = mix(vec4(0.0, 0.0, 0.0, 1.0 / (1. + radialDist*20.)), col, 1.-1. / (1. + radialDist*20.));\n    return clamp(col, 0.0, 1.0);\n}\n\nvec3 sunRays(vec2 uv, float time)\n{\n    float t = 0.1 * time;\n    float PI = 3.14159265359;\n    vec3 ray1 = vec3(252.0/255.0, 0.0, 140.0/255.0);\n    vec3 ray2 = vec3(250.0/255.0, 242.0/255.0, 0.0);\n    vec2 sunPosition = vec2(0.0, -0.05);\n    vec2 p = uv + sunPosition;\n    float c = round(mod(atan(p.y / p.x) * PI * 2.0 + t, 0.6) * 1.0/(0.6));\n    //return ray1 * \n    return (c * ray1 + (1.0 - c) * ray2) * 0.4 * clamp(1.0-length(p*2.0), 0.0, 1.0) * clamp(length(p*3.0), 0.0, 1.0);\n}\n\n\n\n//Shamelessly copied from \n#define R(p,a,r)mix(a*dot(p,a),p,cos(r))+sin(r)*cross(p,a)\nvec4 starfield(vec2 C) {\n    vec4 O=vec4(0);\n    vec3 p,r=iResolution,\n    d=normalize(vec3((C-.5*r.xy)/r.y,1));  \n    for(float i=0.,g,e,s;\n        ++i<99.;\n        O.xyz+=5e-5*abs(cos(vec3(3,2,1)+log(s*9.)))/dot(p,p)/e\n    )\n    {\n        p=g*d;\n        p.z+=iTime*.005;\n        p=R(p,normalize(vec3(1,2,3)),.5);   \n        s=2.5;\n        p=abs(mod(p-1.,2.)-1.)-1.;\n        \n        for(int j=0;j++<10;)\n            p=1.-abs(p-vec3(-1.)),\n            s*=e=-1.8/dot(p,p),\n            p=p*e-.7;\n            g+=e=abs(p.z)/s+.001;\n     }\n     return O /= 16.0;\n}\n\n\nvoid mainImage( out vec4 fragColor, in vec2 fragCoord )\n{\n    // Normalized pixel coordinates (from 0 to 1)\n    vec2 uv = fragCoord/iResolution.xy;\n\n    // Time varying pixel color\n    //vec3 col = 0.5 + 0.5*cos(iTime+uv.xyx+vec3(0,2,4));\n    //vec3 col = vec3(0.0);\n    \n    vec2 mUV = vec2(uv.x - 0.5, (uv.y - 0.5) * (iResolution.y / iResolution.x));\n    \n    float beat = 0.0; //pow(1.0 + sin(iTime*12.0), 5.0)*0.01;\n   \n    vec4 col = neonFloor(mUV, iTime, beat);\n    \n    \n    if (col.w < 0.5)\n    {\n        col += sun(mUV, iTime);\n    }\n    if (col.w < 0.5)\n    {\n        //col += vec4(sunRays(mUV, iTime), 1.0);// + starfield(fragCoord);\n    }\n    if (sunOcclusion(mUV, iTime).x < 0.1) {\n        col += starfield(fragCoord);\n    }\n    vec4 mg = middleGlow(mUV, iTime);\n    \n    \n    \n    col = vec4(mix(col.xyz, mg.xyz, mg.w), 1.0);// + starfield(fragCoord);\n    \n    \n\n    // Output to screen\n    fragColor = col;\n}",
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
          "id": "ctXBDB",
          "date": "1693387432",
          "viewed": 171,
          "name": "Nitor DJ Led Screen Sunset",
          "username": "dj_led_screen",
          "description": "This is diplayed on a LED-screen.",
          "likes": 4,
          "published": 1,
          "flags": 0,
          "usePreview": 0,
          "tags": [
            "sunset",
            "glitter"
          ],
          "hasliked": 0,
          "parentid": "",
          "parentname": ""
        }
      }
];

compileAndStart(jsnShader);