var jsnShader = [
    {
        "ver": "0.1",
        "renderpass": [
          {
            "outputs": [],
            "inputs": [],
            "code": "float time;\n\nfloat noise(vec2 p)\n{\n  return sin(p.x*10.) * sin(p.y*(3. + sin(time/11.))) + .2; \n}\n\nmat2 rotate(float angle)\n{\n  return mat2(cos(angle), -sin(angle), sin(angle), cos(angle));\n}\n\n\nfloat fbm(vec2 p)\n{\n  p *= 1.1;\n  float f = 0.;\n  float amp = .5;\n  for( int i = 0; i < 3; i++) {\n    mat2 modify = rotate(time/50. * float(i*i));\n    f += amp*noise(p);\n    p = modify * p;\n    p *= 2.;\n    amp /= 2.2;\n  }\n  return f;\n}\n\nfloat pattern(vec2 p, out vec2 q, out vec2 r) {\n  q = vec2( fbm(p + vec2(1.)), fbm(rotate(.1*time)*p + vec2(1.)));\n  r = vec2( fbm(rotate(.1)*q + vec2(0.)), fbm(q + vec2(0.)));\n  return fbm(p + 1.*r);\n\n}\n\nfloat digit(vec2 p){\n    vec2 grid = vec2(3.,1.) * 15.;\n    vec2 s = floor(p * grid) / grid;\n    p = p * grid;\n    vec2 q;\n    vec2 r;\n    float intensity = pattern(s/10., q, r)*1.3 - 0.03 ;\n    p = fract(p);\n    p *= vec2(1.2, 1.2);\n    float x = fract(p.x * 5.);\n    float y = fract((1. - p.y) * 5.);\n    int i = int(floor((1. - p.y) * 5.));\n    int j = int(floor(p.x * 5.));\n    int n = (i-2)*(i-2)+(j-2)*(j-2);\n    float f = float(n)/16.;\n    float isOn = intensity - f > 0.1 ? 1. : 0.;\n    return p.x <= 1. && p.y <= 1. ? isOn * (0.2 + y*4./5.) * (0.75 + x/4.) : 0.;\n}\n\nfloat hash(float x){\n    return fract(sin(x*234.1)* 324.19 + sin(sin(x*3214.09) * 34.132 * x) + x * 234.12);\n}\n\nfloat onOff(float a, float b, float c)\n{\n\treturn step(c, sin(iTime + a*cos(iTime*b)));\n}\n\nfloat displace(vec2 look)\n{\n    float y = (look.y-mod(iTime/4.,1.));\n    float window = 1./(1.+50.*y*y);\n\treturn sin(look.y*20. + iTime)/80.*onOff(4.,2.,.8)*(1.+cos(iTime*60.))*window;\n}\n\nvec3 getColor(vec2 p){\n    \n    float bar = mod(p.y + time*20., 1.) < 0.2 ?  1.4  : 1.;\n    p.x += displace(p);\n    float middle = digit(p);\n    float off = 0.002;\n    float sum = 0.;\n    for (float i = -1.; i < 2.; i+=1.){\n        for (float j = -1.; j < 2.; j+=1.){\n            sum += digit(p+vec2(off*i, off*j));\n        }\n    }\n    return vec3(0.9)*middle + sum/10.*vec3(0.,1.,0.) * bar;\n}\n\nvoid mainImage( out vec4 fragColor, in vec2 fragCoord ) {\n    time = iTime / 3.;\n    vec2 p = fragCoord / iResolution.xy;\n    float off = 0.0001;\n    vec3 col = getColor(p);\n    fragColor = vec4(col,1);\n}\n",
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
          "id": "MlsGDs",
          "date": "1426366950",
          "viewed": 6650,
          "name": "ascii terminal",
          "username": "ryk",
          "description": "webgl compatible variant of this shader: [url]https://vimeo.com/119702476[/url]",
          "likes": 72,
          "published": 3,
          "flags": 0,
          "usePreview": 0,
          "tags": [
            "2d",
            "crt",
            "pixels"
          ],
          "hasliked": 1,
          "parentid": "",
          "parentname": ""
        }
      }
];

compileAndStart(jsnShader);