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
                "type": "cubemap",
                "id": "XdX3zn",
                "filepath": "/media/a/488bd40303a2e2b9a71987e48c66ef41f5e937174bf316d3ed0e86410784b919.jpg",
                "sampler": {
                  "filter": "mipmap",
                  "wrap": "repeat",
                  "vflip": "false",
                  "srgb": "false",
                  "internal": "byte"
                }
              }
            ],
            "code": "// Rendering parameters\n#define RAY_LENGTH_MAX\t\t20.0\n#define RAY_BOUNCE_MAX\t\t10\n#define RAY_STEP_MAX\t\t40\n#define COLOR\t\t\t\tvec3 (0.8, 0.8, 0.9)\n#define ALPHA\t\t\t\t0.9\n#define REFRACT_INDEX\t\tvec3 (2.407, 2.426, 2.451)\n#define LIGHT\t\t\t\tvec3 (1.0, 1.0, -1.0)\n#define AMBIENT\t\t\t\t0.2\n#define SPECULAR_POWER\t\t3.0\n#define SPECULAR_INTENSITY\t0.5\n\n// Math constants\n#define DELTA\t0.001\n#define PI\t\t3.14159265359\n\n// Rotation matrix\nmat3 mRotate (in vec3 angle) {\n\tfloat c = cos (angle.x);\n\tfloat s = sin (angle.x);\n\tmat3 rx = mat3 (1.0, 0.0, 0.0, 0.0, c, s, 0.0, -s, c);\n\n\tc = cos (angle.y);\n\ts = sin (angle.y);\n\tmat3 ry = mat3 (c, 0.0, -s, 0.0, 1.0, 0.0, s, 0.0, c);\n\n\tc = cos (angle.z);\n\ts = sin (angle.z);\n\tmat3 rz = mat3 (c, s, 0.0, -s, c, 0.0, 0.0, 0.0, 1.0);\n\n\treturn rz * ry * rx;\n}\n\n// Rotation matrix (rotation on the Y axis)\nvec3 vRotateY (in vec3 p, in float angle) {\n\tfloat c = cos (angle);\n\tfloat s = sin (angle);\n\treturn vec3 (c * p.x - s * p.z, p.y, c * p.z + s * p.x);\n}\n\n// Distance to the scene\nvec3 normalTopA = normalize (vec3 (0.0, 1.0, 1.4));\nvec3 normalTopB = normalize (vec3 (0.0, 1.0, 1.0));\nvec3 normalTopC = normalize (vec3 (0.0, 1.0, 0.5));\nvec3 normalBottomA = normalize (vec3 (0.0, -1.0, 1.0));\nvec3 normalBottomB = normalize (vec3 (0.0, -1.0, 1.6));\nfloat getDistance (in vec3 p) {\n\tp = mRotate (vec3 (iTime)) * p;\n\n\tfloat topCut = p.y - 1.0;\n\tfloat angleStep = PI / (iMouse.z < 0.5 ? 8.0 : 2.0 + floor (18.0 * iMouse.x / iResolution.x));\n\tfloat angle = angleStep * (0.5 + floor (atan (p.x, p.z) / angleStep));\n\tvec3 q = vRotateY (p, angle);\n\tfloat topA = dot (q, normalTopA) - 2.0;\n\tfloat topC = dot (q, normalTopC) - 1.5;\n\tfloat bottomA = dot (q, normalBottomA) - 1.7;\n\tq = vRotateY (p, -angleStep * 0.5);\n\tangle = angleStep * floor (atan (q.x, q.z) / angleStep);\n\tq = vRotateY (p, angle);\n\tfloat topB = dot (q, normalTopB) - 1.85;\n\tfloat bottomB = dot (q, normalBottomB) - 1.9;\n\n\treturn max (topCut, max (topA, max (topB, max (topC, max (bottomA, bottomB)))));\n}\n\n// Normal at a given point\nvec3 getNormal (in vec3 p) {\n\tconst vec2 h = vec2 (DELTA, -DELTA);\n\treturn normalize (\n\t\th.xxx * getDistance (p + h.xxx) +\n\t\th.xyy * getDistance (p + h.xyy) +\n\t\th.yxy * getDistance (p + h.yxy) +\n\t\th.yyx * getDistance (p + h.yyx)\n\t);\n}\n\n// Cast a ray for a given color channel (and its corresponding refraction index)\nvec3 lightDirection = normalize (LIGHT);\nfloat raycast (in vec3 origin, in vec3 direction, in vec4 normal, in float color, in vec3 channel) {\n\n\t// The ray continues...\n\tcolor *= 1.0 - ALPHA;\n\tfloat intensity = ALPHA;\n\tfloat distanceFactor = 1.0;\n\tfloat refractIndex = dot (REFRACT_INDEX, channel);\n\tfor (int rayBounce = 1; rayBounce < RAY_BOUNCE_MAX; ++rayBounce) {\n\n\t\t// Interface with the material\n\t\tvec3 refraction = refract (direction, normal.xyz, distanceFactor > 0.0 ? 1.0 / refractIndex : refractIndex);\n\t\tif (dot (refraction, refraction) < DELTA) {\n\t\t\tdirection = reflect (direction, normal.xyz);\n\t\t\torigin += direction * DELTA * 2.0;\n\t\t} else {\n\t\t\tdirection = refraction;\n\t\t\tdistanceFactor = -distanceFactor;\n\t\t}\n\n\t\t// Ray marching\n\t\tfloat dist = RAY_LENGTH_MAX;\n\t\tfor (int rayStep = 0; rayStep < RAY_STEP_MAX; ++rayStep) {\n\t\t\tdist = distanceFactor * getDistance (origin);\n\t\t\tfloat distMin = max (dist, DELTA);\n\t\t\tnormal.w += distMin;\n\t\t\tif (dist < 0.0 || normal.w > RAY_LENGTH_MAX) {\n\t\t\t\tbreak;\n\t\t\t}\n\t\t\torigin += direction * distMin;\n\t\t}\n\n\t\t// Check whether we hit something\n\t\tif (dist >= 0.0) {\n\t\t\tbreak;\n\t\t}\n\n\t\t// Get the normal\n\t\tnormal.xyz = distanceFactor * getNormal (origin);\n\n\t\t// Basic lighting\n\t\tif (distanceFactor > 0.0) {\n\t\t\tfloat relfectionDiffuse = max (0.0, dot (normal.xyz, lightDirection));\n\t\t\tfloat relfectionSpecular = pow (max (0.0, dot (reflect (direction, normal.xyz), lightDirection)), SPECULAR_POWER) * SPECULAR_INTENSITY;\n\t\t\tfloat localColor = (AMBIENT + relfectionDiffuse) * dot (COLOR, channel) + relfectionSpecular;\n\t\t\tcolor += localColor * (1.0 - ALPHA) * intensity;\n\t\t\tintensity *= ALPHA;\n\t\t}\n\t}\n\n\t// Get the background color\n\tfloat backColor = dot (texture (iChannel0, direction).rgb, channel);\n\n\t// Return the intensity of this color channel\n\treturn color + backColor * intensity;\n}\n\n// Main function\nvoid mainImage (out vec4 fragColor, in vec2 fragCoord) {\n\n\t// Define the ray corresponding to this fragment\n\tvec2 frag = (2.0 * fragCoord.xy - iResolution.xy) / iResolution.y;\n\tvec3 direction = normalize (vec3 (frag, 2.0));\n\n\t// Set the camera\n\tvec3 origin = 7.0 * vec3 ((cos (iTime * 0.1)), sin (iTime * 0.2), sin (iTime * 0.1));\n\tvec3 forward = -origin;\n\tvec3 up = vec3 (sin (iTime * 0.3), 2.0, 0.0);\n\tmat3 rotation;\n\trotation [2] = normalize (forward);\n\trotation [0] = normalize (cross (up, forward));\n\trotation [1] = cross (rotation [2], rotation [0]);\n\tdirection = rotation * direction;\n\n\t// Cast the initial ray\n\tvec4 normal = vec4 (0.0);\n\tfloat dist = RAY_LENGTH_MAX;\n\tfor (int rayStep = 0; rayStep < RAY_STEP_MAX; ++rayStep) {\n\t\tdist = getDistance (origin);\n\t\tfloat distMin = max (dist, DELTA);\n\t\tnormal.w += distMin;\n\t\tif (dist < 0.0 || normal.w > RAY_LENGTH_MAX) {\n\t\t\tbreak;\n\t\t}\n\t\torigin += direction * distMin;\n\t}\n\n\t// Check whether we hit something\n\tif (dist >= 0.0) {\n\t\tfragColor.rgb = texture (iChannel0, direction).rgb;\n\t} else {\n\n\t\t// Get the normal\n\t\tnormal.xyz = getNormal (origin);\n\n\t\t// Basic lighting\n\t\tfloat relfectionDiffuse = max (0.0, dot (normal.xyz, lightDirection));\n\t\tfloat relfectionSpecular = pow (max (0.0, dot (reflect (direction, normal.xyz), lightDirection)), SPECULAR_POWER) * SPECULAR_INTENSITY;\n\t\tfragColor.rgb = (AMBIENT + relfectionDiffuse) * COLOR + relfectionSpecular;\n\n\t\t// Cast a ray for each color channel\n\t\tfragColor.r = raycast (origin, direction, normal, fragColor.r, vec3 (1.0, 0.0, 0.0));\n\t\tfragColor.g = raycast (origin, direction, normal, fragColor.g, vec3 (0.0, 1.0, 0.0));\n\t\tfragColor.b = raycast (origin, direction, normal, fragColor.b, vec3 (0.0, 0.0, 1.0));\n\t}\n\n\t// Set the alpha channel\n\tfragColor.a = 1.0;\n}",
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
          "id": "ltfXDM",
          "date": "1437023412",
          "viewed": 10959,
          "name": "A lonely diamond...",
          "username": "Nrx",
          "description": "Variation of my original [url=https://www.shadertoy.com/view/ldfXzn]Diamonds are Forever[/url].\nUse the mouse (X axis) to change the shape.",
          "likes": 116,
          "published": 3,
          "flags": 0,
          "usePreview": 1,
          "tags": [
            "raymarching",
            "transparency"
          ],
          "hasliked": 1,
          "parentid": "",
          "parentname": ""
        }
      }
];

compileAndStart(jsnShader);