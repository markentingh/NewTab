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
            "code": "// The MIT License\n// Copyright © 2018 Ian Reichert-Watts\n// Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the \"Software\"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions: The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software. THE SOFTWARE IS PROVIDED \"AS IS\", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.\n\n// SHARED PARAMS (Must be same as Buf A :/)\nconst int NUM_PARTICLES = 64;\nconst float INTERACT_DATA_INDEX = float(NUM_PARTICLES)+1.0;\nconst float KINETIC_MOUSE_INDEX = INTERACT_DATA_INDEX+1.0;\n\n// SHARED FUNCTIONS (Must be same as Buf A :/)\nvec4 loadData( float index ) \n{ \n    return texture( iChannel0, vec2((index+0.5)/iChannelResolution[0].x,0.0), -100.0 ); \n}\n\nfloat floorHeight( in vec3 p )\n{\n    return (sin(p.z*0.00042)*0.2)+(sin(p.z*0.008)*0.64) + (sin(p.x*0.42+sin(p.z*0.000042)*420.0))*0.42-1.0;\n}\n\n// PARAMS\nconst vec3 COLOR_PRIMARY = vec3(0.79, 0.17, 0.32); // Red Magenta\nconst vec3 COLOR_SECONDARY = vec3(0.0022, 0.00, 0.0032); // Dark Purple\nconst vec3 COLOR_TERTIARY = vec3(0.0, 1.0, 0.75); // Teal\n\nconst vec3 SUN_DIR = normalize(vec3(0.0,-0.13,-1.0));\n\n// CONST\nconst float PI = 3.14159;\nconst float TAU = PI * 2.0;\nconst int STEPS = 128;\nconst float STEP_SIZE = 0.42;\n\nconst float T_MAX = float(STEPS)*STEP_SIZE;\n\nfloat floorHeightRender( in vec3 p )\n{\n    float height = floorHeight(p);\n    vec2 point = iResolution.xy * 0.5;\n    vec2 coord = floor(p.xz/0.1)*0.1;\n    height += sin(length(coord-point)*(10000.0+iTime*0.02))*0.1;\n    return height;\n}\n\nvec4 render( in vec3 rayOrigin, in vec3 rayDir)\n{\n    vec4 col = vec4(0.0);\n    // Sun\n    float sunDot = dot(rayDir, -SUN_DIR);\n    // Sun Bloom\n    col.rgb = max(col.rgb, 0.1*abs(sin(iTime+sunDot*42.0))*COLOR_PRIMARY);\n    col.rgb += vec3(pow(sunDot, 42.0)*0.42)*COLOR_TERTIARY;\n    // Sun Body\n    float sunAlpha = clamp(sunDot-0.99, 0.0, 1.0);\n    vec3 rayDown = cross(vec3(1.0,0.0,0.0), rayDir);\n    sunAlpha *= clamp(cos(PI*2.9*clamp(dot(rayDown, SUN_DIR)*20.0+0.2, 0.0, 42.0)), 0.0, 1.0);\n    col.rgb = max(col.rgb, 200.0*sunAlpha*COLOR_PRIMARY);\n    // Sun Burst\n    col.rgb += 0.3*sin((1.0-sunDot)*PI)*pow(sunDot,8.0)*abs(sin(atan(rayDir.y-0.1, rayDir.x)*8.0))*COLOR_TERTIARY;\n    \n    float t = STEP_SIZE;\n    for( int i=0; i<STEPS; i++ )\n    {\n        vec3 p = rayOrigin+(rayDir*t);\n        \n        float depth = (t/T_MAX);\n        float distFade = pow(1.0-depth, 2.0);\n        \n        float delta = p.y - floorHeightRender(p);\n        \n        // Floor\n        float alpha = pow(clamp(1.0 - abs(delta), 0.0, 1.0), 42.0);\n        float gridX = pow(abs(sin(p.x+sin(p.z*0.033)*6.4)), 1.42);\n        float gridZ = pow(abs(sin(p.z*0.042)+sin(p.x*0.013)*0.2), 20.0);\n        col.rgb = max(col.rgb, alpha*gridX*COLOR_PRIMARY);\n        col.rgb = max(col.rgb, alpha*gridZ*COLOR_PRIMARY);\n        float lightX = pow(abs(sin(p.x*0.064)*10.2), 0.42);\n        col.rgb += 0.015*(pow(alpha,0.2)*(lightX-gridZ)*COLOR_TERTIARY)*distFade;\n        \n        // Atmosphere\n        float bandFreq = 0.42;\n        float band;\n        if (delta > 0.0)\n        {\n            band = sin(p.z-p.y*bandFreq)+cos(p.z*bandFreq);\n        }\n        else\n        {\n            band = sin(p.z+p.y*bandFreq)+cos(p.z*bandFreq);\n        }\n        band += 1.0-clamp(p.y*0.8, 0.0, 1.0);\n        vec3 cloud = vec3(gridZ+band, (abs(gridZ+band)), (gridZ*band));\n        col.rgb += 0.0042*(1.0-alpha)*cloud*COLOR_PRIMARY;\n        col.rgb += 0.01*clamp(p.y*0.03, 0.0, 1.0)*COLOR_TERTIARY;\n        \n        // Fog\n        col.rgb += COLOR_SECONDARY;\n        \n        t += STEP_SIZE;\n    }\n    \n    return col;\n}\n\nvoid mainImage( out vec4 fragColor, in vec2 fragCoord )\n{\n    vec2 uv = fragCoord/iResolution.xy;\n    vec4 interactData = loadData(INTERACT_DATA_INDEX);\n    \n    // Camera must be the same as Buf A :/\n    vec3 rayOrigin = vec3(0.0, 0.0, iTime*80.0);\n    float floorY = floorHeight(rayOrigin);\n    rayOrigin.y = floorY*0.9 + 0.2;\n    float rotYaw = -(interactData.x/iResolution.x)*TAU;\n    float rotPitch = (interactData.y/iResolution.y)*PI;\n    \n    vec3 forward = normalize( vec3(sin(rotYaw), rotPitch, cos(rotYaw)) );\n    vec3 wup = normalize(vec3((floorY-floorHeight(rayOrigin+vec3(2.0,0.0,0.0)))*0.2,1.0,0.0));\n    vec3 right = normalize( cross( forward, wup ) );\n    vec3 up = normalize( cross( right, forward ) );\n    mat3 camMat = mat3(right, up, forward); \n    \n    vec3 surfforward = normalize( vec3(sin(rayOrigin.z*0.01)*0.042, ((floorY-floorHeight(rayOrigin+vec3(0.0,0.0,-20.0)))*0.2)+0.12, 1.0) );\n    vec3 wright = vec3(1.0,0.0,0.0);\n    mat3 surfMat = mat3(wright, up, surfforward); \n    \n    vec2 centeredCoord = (fragCoord-(iResolution.xy*0.5))/iResolution.x;\n    \n    vec3 rayDir = normalize( surfMat*normalize( camMat*normalize( vec3(centeredCoord, 1.0) ) ) );\n    \n    float mask = 1.0-texture(iChannel0, uv).a;\n    if (mask > 0.0)\n    {\n        float height = texture(iChannel0, uv).b;\n        vec3 normal = -normalize(vec3(texture(iChannel0, uv).xy*2.0-vec2(1.0), -1.0));\n        float refraction = height*mask*0.3;\n        rayDir = normal*refraction + rayDir*(1.0-refraction);\n        rayDir = normalize(rayDir);\n    }\n    \n    //*/ Remove/Add initial '/' to toggle between Image and Buf A\n    // Image\n    fragColor = render(rayOrigin, rayDir);\n    /*/\n\t// Buf A\n    fragColor = texture(iChannel0, uv);\n\t//*/\n}",
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
            "code": "// The MIT License\n// Copyright © 2018 Ian Reichert-Watts\n// Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the \"Software\"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions: The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software. THE SOFTWARE IS PROVIDED \"AS IS\", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.\n\n// SHARED PARAMS (Must be same as Image :/)\nconst int NUM_PARTICLES = 64;\nconst float INTERACT_DATA_INDEX = float(NUM_PARTICLES)+1.0;\nconst float KINETIC_MOUSE_INDEX = INTERACT_DATA_INDEX+1.0;\n\n// SHARED FUNCTIONS (Must be same as Image :/)\nvec4 loadData( in float index ) \n{ \n    return texture( iChannel0, vec2((index+0.5)/iChannelResolution[0].x,0.0), -100.0 ); \n}\n\nfloat floorHeight( in vec3 p )\n{\n    return (sin(p.z*0.00042)*0.2)+(sin(p.z*0.008)*0.64) + (sin(p.x*0.42+sin(p.z*0.000042)*420.0))*0.42-1.0;\n}\n\n// PARAMS\nconst float PARTICLE_LIFETIME_MIN = 0.02;\nconst float PARTICLE_LIFETIME_MAX = 4.2;\nconst float FALL_SPEED = 42.0;\nconst float JITTER_SPEED = 300.0;\nconst vec3 WIND_DIR = vec3(0.0,0.0,-1.0);\nconst float WIND_INTENSITY = 4.2;\n\n// CONST\nconst float PI = 3.14159;\nconst float TAU = PI * 2.0;\n\nfloat randFloat( in float n )\n{\n    return fract( sin( n*64.19 )*420.82 );\n}\nvec2 randVec2( in vec2 n )\n{\n    return vec2(randFloat( n.x*12.95+n.y*43.72 ),randFloat( n.x*16.21+n.y*90.23 )); \n}\n\nvoid mainImage( out vec4 fragColor, in vec2 fragCoord )\n{    \n    if ( fragCoord.y > iResolution.y-2.0 )\n    {\n        // Discard top pixels to avoid persistent data getting included in blur\n        discard;\n    }\n    else if ( fragCoord.y < 2.0 )\n    {\n        if ( fragCoord.y >= 1.0 || fragCoord.x > float(NUM_PARTICLES+4) )\n        {\n            discard;\n        }\n        // Store persistent data in bottom pixel row\n        if ( fragCoord.x < float(NUM_PARTICLES) )\n        {\n            vec4 particle;\n            float pidx = floor(fragCoord.x);\n\n            if ( iFrame == 0 )\n            {\n                float padding = 0.01;\n                float particleStep = (1.0-(padding*2.0))/float(NUM_PARTICLES);\n                particle = vec4(0.0);\n                float r1 = randFloat(pidx);\n                particle.xy = vec2(padding+(particleStep*pidx), 1.0+(1.0*r1));\n                particle.xy *= iResolution.xy;\n                particle.a = r1*(PARTICLE_LIFETIME_MAX-PARTICLE_LIFETIME_MIN);\n            }\n            else\n            {   \n               \tvec4 interactData = loadData(INTERACT_DATA_INDEX);\n                \n                // Tick particles\n        \t\tparticle = loadData(pidx);\n                vec2 puv = particle.xy / iResolution.x;\n                vec4 pbuf = texture(iChannel0, puv);\n                \n                // Camera must be the same as Image :/\n                float rotYaw = -(interactData.x/iResolution.x)*TAU;\n                float rotPitch = (interactData.y/iResolution.y)*PI;\n                vec3 rayOrigin = vec3(0.0, 0.1, iTime*80.0);\n                float floorY = floorHeight(rayOrigin);\n                rayOrigin.y = floorY*0.9 + 0.2;\n\n                vec3 forward = normalize( vec3(sin(rotYaw), rotPitch, cos(rotYaw)) );\n                vec3 wup = normalize(vec3((floorY-floorHeight(rayOrigin+vec3(2.0,0.0,0.0)))*-0.2,1.0,0.0));\n                vec3 right = normalize( cross( forward, wup ) );\n                vec3 up = normalize( cross( right, forward ) );\n                mat3 camMat = mat3(right, up, forward);\n\n                vec3 surfforward = normalize( vec3(sin(rayOrigin.z*0.01)*0.042, ((floorY-floorHeight(rayOrigin+vec3(0.0,0.0,-20.0)))*0.2)+0.12, 1.0) );\n                vec3 wright = vec3(1.0,0.0,0.0);\n                mat3 surfMat = mat3(wright, up, surfforward); \n\n                vec2 centeredCoord = puv-vec2(0.5);\n                vec3 rayDir = normalize( surfMat*normalize( camMat*normalize( vec3(centeredCoord, 1.0) ) ) );\n                vec3 rayRight = normalize( cross( rayDir, up ) );\n                vec3 rayUp = normalize( cross( rayRight, rayDir ) );\n\n                // Wind\n                vec2 windShield = (puv-vec2(0.5, 0.0))*2.0;\n                float speedScale = 0.0015*(0.1+1.9*(sin(PI*0.5*pow( particle.z/particle.a, 2.0 ))))*iResolution.y;\n                particle.x += (windShield.x+WIND_INTENSITY*dot(rayRight, WIND_DIR))*FALL_SPEED*speedScale*iTimeDelta;\n                particle.y += (windShield.y+WIND_INTENSITY*dot(rayUp, WIND_DIR))*FALL_SPEED*speedScale*iTimeDelta;\n\n                // Jitter\n                particle.xy += 0.001*(randVec2( particle.xy+iTime )-vec2(0.5))*iResolution.y*JITTER_SPEED*iTimeDelta;\n\n                // Age\n                // Don't age as much when traveling over existing particle trails\n                particle.z += (1.0-pbuf.b)*iTimeDelta;\n\n                // Die of old age. Reset\n                if ( particle.z > particle.a )\n                {\n                    float seedX = particle.x*25.36+particle.y*42.92;\n                    float seedY = particle.x*16.78+particle.y*93.42;\n                    particle = vec4(0.0);\n                    particle.x = randFloat( seedX )*iResolution.x;\n                    particle.y = randFloat( seedY )*iResolution.y;\n                    particle.a = PARTICLE_LIFETIME_MIN+randFloat(pidx)*(PARTICLE_LIFETIME_MAX-PARTICLE_LIFETIME_MIN);\n                }\n            }\n            fragColor = particle;\n        }\n\t\telse\n        {\n            float dataIndex = floor(fragCoord.x);\n            vec4 interactData = loadData(INTERACT_DATA_INDEX);\n            vec4 kineticMouse = loadData(KINETIC_MOUSE_INDEX);\n            \n            if ( iMouse.z > 0.0 )\n            {\n            \tvec2 mouseDelta = iMouse.xy-kineticMouse.xy;\n                if ( length(iMouse.xy-iMouse.zw) < 4.0 )\n                {\n                    mouseDelta = vec2(0.0);\n                }\n                interactData.xy += mouseDelta;\n                interactData.y = clamp( interactData.y, -iResolution.y, iResolution.y );\n                kineticMouse = vec4(iMouse.xy, mouseDelta);\n            }\n            else\n            {\n                kineticMouse.zw *= 0.9;\n                interactData.xy += kineticMouse.zw;\n                interactData.y = clamp( interactData.y, -iResolution.y, iResolution.y );\n                kineticMouse.xy = iMouse.xy;\n            }\n            fragColor = (dataIndex == KINETIC_MOUSE_INDEX) ? kineticMouse : interactData;\n        }\n    }\n    else\n    {\n        // Draw Particles\n        vec2 blurUV = fract( (fragCoord.xy + (fract( float(iFrame)*0.5 )*2.0-0.5)) / iResolution.xy );\n        vec2 uv = fragCoord.xy / iResolution.xy;\n        fragColor = texture( iChannel0, uv );\n        vec4 prevColor = fragColor;\n\n        if ( fragColor.a < 1.0 )\n        {\n            fragColor = texture( iChannel0, blurUV );\n        }\n        fragColor.b *= 0.996;\n\n        for ( int i=0; i<NUM_PARTICLES; i++ )\n        {\n    \t\tvec4 particle = loadData(float(i));\n            vec2 delta = fragCoord.xy-particle.xy;\n            float dist = length(delta);\n            float radius = 0.002*(0.5+2.0*particle.a+abs(sin(1.0*iTime+float(i))))*iResolution.y;\n            radius += 4.0*randFloat( particle.x*35.26+particle.y*93.12 )*pow((particle.z/particle.a), 12.0);\n            if ( dist < radius )\n            {\n                // normal\n                vec2 dir = delta/dist;\n                fragColor.r = dot(dir, vec2(1.0,0.0))*0.5+0.5;\n                fragColor.g = dot(dir, vec2(0.0,1.0))*0.5+0.5;\n                // height\n                float height = sin( dist/radius*PI*0.5 );\n                height = pow( height, 8.0 );\n                height = 1.0-height;\n                fragColor.b = max( height, prevColor.b );\n                // age\n                fragColor.a = 0.0;\n            }\n        }\n        fragColor.a += 0.1*iTimeDelta;\n    }\n}",
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
          "id": "ltccRl",
          "date": "1533609026",
          "viewed": 11290,
          "name": "Outrun The Rain",
          "username": "irwatts",
          "description": "Almost there.\nMouse drag rotates the camera.\nDroplets get pushed by the wind and stay alive longer when traveling along existing water trails.",
          "likes": 196,
          "published": 3,
          "flags": 32,
          "usePreview": 0,
          "tags": [
            "procedural",
            "refraction",
            "particles",
            "outrun",
            "rain"
          ],
          "hasliked": 1,
          "parentid": "",
          "parentname": ""
        }
      }
];

compileAndStart(jsnShader);