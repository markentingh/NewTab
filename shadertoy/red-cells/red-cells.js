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
                "id": "XdXGzn",
                "filepath": "/media/a/3083c722c0c738cad0f468383167a0d246f91af2bfa373e9c5c094fb8c8413e0.png",
                "sampler": {
                  "filter": "mipmap",
                  "wrap": "repeat",
                  "vflip": "false",
                  "srgb": "false",
                  "internal": "byte"
                }
              }
            ],
            "code": "// Red Cells - @P_Malin\n// License Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License.\n//\n// Some red blood cells on an adventure.\n// Click the mouse to rotate view.\n\nfloat kFarClip=1000.0;\nfloat kZRepeat = 5.0;\n\nvec2 GetWindowCoord( const in vec2 vUV );\nvec3 GetCameraRayDir( const in vec2 vWindow, const in vec3 vCameraPos, const in vec3 vCameraTarget );\nvec3 GetSceneColour( in vec3 vRayOrigin,  in vec3 vRayDir );\nvec3 ApplyPostFX( const in vec2 vUV, const in vec3 vInput );\n\n\n\nfloat fPulse = 0.0;\nfloat fDPulse = 0.0;\n\nconst float kExposure = 1.5;\n\nconst vec3 vLightColour = vec3(1.0, 0.01, 0.005);\n\nvec3 vRimLightColour = vLightColour * 0.5;\nvec3 vAmbientLight = vLightColour * 0.05;\nvec3 vEmissiveLight = vLightColour * 1.0;\n\t\nfloat kFogDensity = 0.0075;\nvec3 vFogColour = vec3(1.0, 0.05, 0.005) * 0.25 * 10.0;\n\nfloat GetGlobalTime()\n{\n\tfloat fStartTime = 90.0;\n    return fStartTime + iTime;\n}\n\nfloat GetPulseTime()\n{\n    float fGlobalTime = GetGlobalTime();\n    \n\tfloat s= sin(fGlobalTime * 2.0);\n\tfPulse = s * s;\n\tfDPulse = cos(fGlobalTime * 2.0);\n\treturn fGlobalTime + fPulse * 0.2;\n}\n\nfloat GetCameraZ()\n{\n    return GetPulseTime() * 20.0;\n}\n\nmat3 SetRot( const in vec3 r )\n{\n    float a = sin(r.x); float b = cos(r.x); \n    float c = sin(r.y); float d = cos(r.y); \n    float e = sin(r.z); float f = cos(r.z); \n\n    float ac = a*c;\n    float bc = b*c;\n\n    return mat3( d*f,      d*e,       -c,\n                 ac*f-b*e, ac*e+b*f, a*d,\n                 bc*f+a*e, bc*e-a*f, b*d );\n}\n\nvec3 TunnelOffset( float z )\n{\n\tfloat r = 20.0;\n\tvec3 vResult = vec3( sin(z * 0.0234)* r, sin(z * 0.034)* r, 0.0 );\n\treturn vResult;\n}\n\nvoid mainImage( out vec4 fragColor, in vec2 fragCoord )\n{\n\tvec2 vUV = fragCoord.xy / iResolution.xy;\n\n\tvec2 vMouse = iMouse.xy / iResolution.xy;\n\n    float fCameraZ = GetCameraZ();\n\n\tvec3 vCameraPos = vec3(0.0, 0.0, 0.0);\n\tvCameraPos.z += fCameraZ;\n\tvCameraPos += TunnelOffset(fCameraZ);\n\t\n\tvec3 vCameraTarget = vec3(0.0);\n\n\tfloat fAngle = 0.0;\n\n\tif(iMouse.z > 0.0)\n\t{\n\t\tfAngle = vMouse.x * 3.1415 * 2.0;\n\t}\n\t\n\tfloat fTargetLookahead = 40.0;\n\t\n\tfloat fCameraTargetZ = fCameraZ + fTargetLookahead * cos(fAngle); \n\t\n\tvCameraTarget.z += fCameraTargetZ;\n\tvCameraTarget += TunnelOffset(fCameraTargetZ);\n\t\n\tvCameraTarget.x += sin(fAngle) * fTargetLookahead;\n\n\t// camera shake\n\tvec3 vShake = (textureLod(iChannel0, vec2(GetPulseTime() * 0.05, 0.0), 0.0).rgb * 2.0 - 1.0);\n\tvCameraTarget += vShake * fDPulse * 0.02 * length(vCameraTarget - vCameraPos);\n\t\n\tfloat fFOV = 0.5;\n\t\n\tvec3 vRayOrigin = vCameraPos;\t\n\tvec3 vRayDir = GetCameraRayDir( GetWindowCoord(vUV) * fFOV, vCameraPos, vCameraTarget );\n\t\t\n\tvec3 vResult = GetSceneColour(vRayOrigin, vRayDir);\n\t\n\tvec3 vFinal = ApplyPostFX( vUV, vResult );\n\t\n\tfragColor = vec4(vFinal, 1.0);\n}\n\n// CAMERA\n\nvec2 GetWindowCoord( const in vec2 vUV )\n{\n\tvec2 vWindow = vUV * 2.0 - 1.0;\n\tvWindow.x *= iResolution.x / iResolution.y;\n\n\treturn vWindow;\t\n}\n\nvec3 GetCameraRayDir( const in vec2 vWindow, const in vec3 vCameraPos, const in vec3 vCameraTarget )\n{\n\tvec3 vForward = normalize(vCameraTarget - vCameraPos);\n\tvec3 vRight = normalize(cross(vec3(0.0, 1.0, 0.0), vForward));\n\tvec3 vUp = normalize(cross(vForward, vRight));\n\t\t\t\t\t\t\t  \n\tvec3 vDir = normalize(vWindow.x * vRight + vWindow.y * vUp + vForward * 2.0);\n\n\treturn vDir;\n}\n\n// POSTFX\n\nvec3 ApplyVignetting( const in vec2 vUV, const in vec3 vInput )\n{\n\tvec2 vOffset = (vUV - 0.5) * sqrt(2.0);\n\t\n\tfloat fDist = dot(vOffset, vOffset);\n\t\n\tconst float kStrength = 1.0;\n\t\n\tfloat fShade = mix( 1.0, 1.0 - kStrength, fDist );\t\n\n\treturn vInput * fShade;\n}\n\nvec3 ApplyTonemap( const in vec3 vLinear )\n{\t\n\treturn (1.0 - exp2(vLinear * -kExposure));\t\n}\n\nvec3 ApplyGamma( const in vec3 vLinear )\n{\n\tconst float kGamma = 2.2;\n\n\treturn pow(vLinear, vec3(1.0/kGamma));\t\n}\n\nvec3 ApplyPostFX( const in vec2 vUV, const in vec3 vInput )\n{\n\tvec3 vTemp = vInput;\n\t\n\tvTemp = ApplyVignetting( vUV, vTemp );\t\n\t\n\tvTemp = ApplyTonemap(vTemp);\n\t\n\tvTemp = ApplyGamma(vTemp);\n\n\treturn vTemp;\n}\n\t\n// RAYTRACE\n\nstruct C_Intersection\n{\n\tvec3 vPos;\n\tfloat fDist;\t\n\tvec3 vNormal;\n\tvec3 vUVW;\n\tfloat fObjectId;\n};\n\nfloat GetCellShapeDistance( const in vec3 vPos  )\n{\t\n\tconst vec3 vParam = vec3(1.0, 0.4, 0.4);\n\n\tfloat r = length(vPos.xz);\n\tvec2 vClosest = vec2(clamp(r - vParam.x, 0.0, vParam.x), vPos.y);\n\tfloat unitr = clamp(r / vParam.x, 0.0, 1.0);\n\tfloat stepr = 3.0 * unitr * unitr - 2.0 * unitr * unitr * unitr;\n  \treturn length(vClosest)-(vParam.y) - stepr * vParam.y * 0.5;\n\n}\n\nvec3 WarpCellDomain( const in vec3 vPos )\n{\n\tvec3 vResult = vPos;\n\tvResult.y += (vPos.x * vPos.x - vPos.z * vPos.z) * 0.05;\n\treturn vResult;\n}\n\nfloat GetCellDistance( const in vec3 vPos, const in float fSeed )\n{\n\tvec3 vCellPos = vPos;\n\t\n\tvec3 vRotSpeed = vec3(0.0, 1.0, 2.0) + vec3(1.0, 2.0, 3.0) * fSeed;\n\t\n\tmat3 mCell = SetRot(vRotSpeed * GetGlobalTime());\n\t\n\tvCellPos = vCellPos * mCell;\n\t\n\tvCellPos = WarpCellDomain(vCellPos);\n\t\n\tfloat fCellDist = GetCellShapeDistance(vCellPos);\n\t\n\treturn fCellDist;\t\n}\n\nfloat GetCellProxyDistance( const in vec3 vPos, const in float fSeed )\n{\n\treturn length(vPos) - 1.4;\n}\n\nfloat GetSegment( const in float fPos, const in float fRepeat )\n{\n\tfloat fTilePos = (fPos / fRepeat) + 0.5;\n\treturn floor(fTilePos);\n}\n\nvec3 WarpTunnelDomain( const in vec3 vPos )\n{\n\treturn vPos - TunnelOffset(vPos.z);\n}\n\nfloat GetTileSeed( const float fTile )\n{\n\t//return fract(sin(fTile * 123.4567) * 1234.56);\t\n\n    // https://www.shadertoy.com/view/4djSRW\n    // Hash without Sine - Dave_Hoskins\n\t#define MOD3 vec3(.1031,.11369,.13787)\n    \n    float p = fTile;\n    \n\tvec3 p3  = fract(vec3(p) * MOD3);\n    p3 += dot(p3, p3.yzx + 19.19);\n    return fract((p3.x + p3.y) * p3.z);\n}\n\nvec3 GetCellPos( const float fTile, const float fSeed )\n{\n\tfloat fTileZ = fTile * kZRepeat;\n\tfloat fOffsetRadius = 2.0 + fSeed * 1.5;\n\t\n\treturn vec3( fOffsetRadius * sin(fSeed * 3.14 * 2.0), fOffsetRadius * cos(fSeed * 3.14 * 2.0), fTileZ);\n}\n\n\nfloat GetSceneDistanceMain( out vec4 vOutUVW_Id, const in vec3 vPos )\n{\n\tvOutUVW_Id = vec4(0.0, 0.0, 0.0, 0.0);\n\tfloat fOutDist = kFarClip;\n\t\n\tvec3 vCellDomain = vPos;\n\t\t\t\n\tvCellDomain.z -= GetPulseTime() * 30.0 + fPulse * 0.5;\n\t\t\n\tfloat fCurrTile = GetSegment(vCellDomain.z, kZRepeat);\n\n\t// approximate position of adjacent cell\n\t{\n\t\tfloat fTileMid = (fCurrTile) * kZRepeat;\n\t\tfloat fTile = fCurrTile;\n\t\tif(vCellDomain.z > fTileMid)\n\t\t{\n\t\t\tfTile++;\n\t\t}\n\t\telse\n\t\t{\n\t\t\tfTile--;\n\t\t}\n\t\tfloat fSeed = GetTileSeed(fTile);\n\n\t\tvec3 vCellPos = GetCellPos(fTile, fSeed);\n\t\tvec3 vCurrCellDomain = vCellDomain - vCellPos;\n\n\t\tvec4 vCellUVW_Id = vec4(vCurrCellDomain.xzy, 2.0);\n\t\t\t\n\t\tfloat fCellDist = GetCellProxyDistance( vCurrCellDomain, fSeed );\n\t\t\n\t\n\t\tif( fCellDist < fOutDist )\n\t\t{\n\t\t\tfOutDist = fCellDist;\n\t\t\tvOutUVW_Id = vCellUVW_Id;\n\t\t}\n\t}\n\t{\n\t\tfloat fTile = fCurrTile;\t\t\t\t\n\t\tfloat fSeed = GetTileSeed(fTile);\n\n\t\tvec3 vCellPos = GetCellPos(fTile, fSeed);\n\t\tvec3 vCurrCellDomain = vCellDomain - vCellPos;\n\t\t\t\n\t\tvec4 vCellUVW_Id = vec4(vCurrCellDomain.xzy, 2.0);\n\t\t\n\t\tfloat fCellDist = GetCellDistance( vCurrCellDomain, fSeed );\n\t\t\n\t\n\t\tif( fCellDist < fOutDist )\n\t\t{\n\t\t\tfOutDist = fCellDist;\n\t\t\tvOutUVW_Id = vCellUVW_Id;\n\t\t}\n\t}\n\t\n\tfloat fNoiseMag = 0.01;\n\t\t\n\tfloat s =sin(vPos.z * 0.5) * 0.5 + 0.5;\n\tfloat s2 = s * s;\n\tfloat fWallDist = 6.0 - length(vPos.xy) + (2.0 - s2 * 2.0);\n\t\t\n\tif( fWallDist < fOutDist )\n\t{\n\t\tfOutDist = fWallDist;\n\t\tvOutUVW_Id = vec4(atan(vPos.x, vPos.y) * (2.0 / radians(360.0)), vPos.z * 0.05, 0.0, 1.0);\n\t\t\n\t\tfNoiseMag = 0.1;\n\t}\n\t\t\n\t// noise\n\tfloat fSample = textureLod(iChannel0, vOutUVW_Id.xy, 0.0).r;\n\tfOutDist -= fSample * fNoiseMag;\n\t\n\treturn fOutDist;\t\n}\n\nfloat GetSceneDistance( out vec4 vOutUVW_Id, const in vec3 vPosIn )\n{\n\tvec3 vPos = vPosIn;\n\n\tvPos = WarpTunnelDomain(vPos);\n\n\treturn GetSceneDistanceMain(vOutUVW_Id, vPos);\n}\n\nvec3 GetSceneNormal(const in vec3 vPos)\n{\n    const float fDelta = 0.01;\n\n    vec3 vDir1 = vec3( 1.0, -1.0, -1.0);\n    vec3 vDir2 = vec3(-1.0, -1.0,  1.0);\n    vec3 vDir3 = vec3(-1.0,  1.0, -1.0);\n    vec3 vDir4 = vec3( 1.0,  1.0,  1.0);\n\t\n    vec3 vOffset1 = vDir1 * fDelta;\n    vec3 vOffset2 = vDir2 * fDelta;\n    vec3 vOffset3 = vDir3 * fDelta;\n    vec3 vOffset4 = vDir4 * fDelta;\n\n\tvec4 vUnused;\n    float f1 = GetSceneDistance( vUnused, vPos + vOffset1 );\n    float f2 = GetSceneDistance( vUnused, vPos + vOffset2 );\n    float f3 = GetSceneDistance( vUnused, vPos + vOffset3 );\n    float f4 = GetSceneDistance( vUnused, vPos + vOffset4 );\n\t\n    vec3 vNormal = vDir1 * f1 + vDir2 * f2 + vDir3 * f3 + vDir4 * f4;\t\n\t\t\n    return normalize( vNormal );\n}\n\nvoid TraceScene( out C_Intersection outIntersection, const in vec3 vOrigin, const in vec3 vDir )\n{\t\n\tvec4 vUVW_Id = vec4(0.0);\t\t\n\tvec3 vPos = vec3(0.0);\n\t\n\tfloat t = 0.01;\n\tconst int kRaymarchMaxIter = 96;\n\tfor(int i=0; i<kRaymarchMaxIter; i++)\n\t{\n\t\tvPos = vOrigin + vDir * t;\n\t\tfloat fDist = GetSceneDistance(vUVW_Id, vPos);\t\t\n\t\tt += fDist;\n\t\tif(abs(fDist) < 0.001)\n\t\t{\n\t\t\tbreak;\n\t\t}\t\t\n\t\tif(t > 200.0)\n\t\t{\n\t\t\tt = kFarClip;\n\t\t\tvPos = vOrigin + vDir * t;\n\t\t\tvUVW_Id = vec4(0.0);\n\t\t\tbreak;\n\t\t}\n\t}\n\t\n\toutIntersection.fDist = t;\n\toutIntersection.vPos = vPos;\n\toutIntersection.vNormal = GetSceneNormal(vPos);\n\toutIntersection.vUVW = vUVW_Id.xyz;\n\toutIntersection.fObjectId = vUVW_Id.w;\n}\n\n// SCENE MATERIALS\n\nvec3 SampleTunnel( vec2 vUV )\n{\n    // Sample texture twice to remove seam when UV co-ords wrap back to 0\n    \n\t// sample a lower mip for more of a 'subsurface scattering' effect\n    float mipBias = 4.0;\n\n    // Sample the texture with UV modulo seam at the bottom\n    vec3 vSampleA = texture(iChannel0, vUV, mipBias).rgb;\n    \n    vec2 vUVb = vUV;\n    vUVb.x = fract(vUVb.x + 0.5) - 0.5; // move UV modulo seam\n    \n    // Sample the texture with UV modulo seam on the left\n    vec3 vSampleB = texture(iChannel0, vUVb, mipBias).rgb;\n    \n    // Blend out seam around zero\n    float fBlend = abs( fract( vUVb.x ) * 2.0 - 1.0 );\n    \n    return mix(vSampleA, vSampleB, fBlend);\n}\n\nvoid GetSurfaceInfo(out vec3 vOutAlbedo, out vec3 vEmissive, const in C_Intersection intersection )\n{\n\tvEmissive = vec3(0.0);\n\t\t\n\tif(intersection.fObjectId == 1.0)\n\t{\n\t\tvOutAlbedo = vec3(1.0, 0.01, 0.005) * 0.5;\n\t\t\n\t\tvec3 vSample = SampleTunnel( intersection.vUVW.xy );\n\t\t\n\t\tvSample = vSample * vSample;\n\t\t\n\t\tvEmissive =  vSample.r * vEmissiveLight;\n\t}\n\telse if(intersection.fObjectId == 2.0)\n\t{\n\t\tvOutAlbedo = vec3(1.0, 0.01, 0.005);\n\t}\n}\n\nfloat GetFogFactor(const in float fDist)\n{\n\treturn exp(fDist * -kFogDensity);\t\n}\n\nvec3 GetFogColour(const in vec3 vDir)\n{\n\treturn vFogColour;\t\n}\n\nvoid ApplyAtmosphere(inout vec3 vColour, const in float fDist, const in vec3 vRayOrigin, const in vec3 vRayDir)\n{\t\t\n\tfloat fFogFactor = GetFogFactor(fDist);\n\tvec3 vFogColour = GetFogColour(vRayDir);\t\t\t\n\tvColour = mix(vFogColour, vColour, fFogFactor);\t\n}\n\n// TRACING LOOP\n\n\t\nvec3 GetSceneColour( in vec3 vRayOrigin,  in vec3 vRayDir )\n{\n\tvec3 vColour = vec3(0.0);\n\t\n\t{\t\n\t\tC_Intersection intersection;\t\t\t\t\n\t\tTraceScene( intersection, vRayOrigin, vRayDir );\n\n\t\t{\t\t\n\t\t\tvec3 vAlbedo;\n\t\t\tvec3 vBumpNormal;\n\t\t\tvec3 vEmissive;\n\t\t\t\n\t\t\tGetSurfaceInfo( vAlbedo, vEmissive, intersection );\t\t\t\n\t\t\t\t\t\n\t\t\tvec3 vDiffuseLight = vAmbientLight;\n\t\t\t\n\t\t\t// rim light\n\t\t\tvDiffuseLight += clamp(dot(vRayDir, intersection.vNormal) + 0.5, 0.0, 1.0) * vRimLightColour;\n\t\t\t\n\t\t\tvColour = vAlbedo * vDiffuseLight + vEmissive;\t\t\t\n\t\t\t\n\t\t\tApplyAtmosphere(vColour, intersection.fDist, vRayOrigin, vRayDir);\t\t\n\t\t\t\n\t\t}\t\t\t\n\n\t}\n\t\n\treturn vColour;\n}\n\n\nvoid mainVR( out vec4 fragColor, in vec2 fragCoord, in vec3 fragRayOri, in vec3 fragRayDir )\n{\n    fragRayOri.z *= -1.0;\n    fragRayDir.z *= -1.0;\n         \n    float fCameraZ = GetCameraZ();\n\n   \tfragRayOri.z += fCameraZ;\n\tfragRayOri += TunnelOffset(fCameraZ);\n\n\tvec3 vResult = GetSceneColour(fragRayOri, fragRayDir);\n\t\n\tvec3 vFinal = ApplyPostFX( vec2(0.5), vResult );\n    \n    fragColor = vec4( vFinal, 1.0 );\n}",
            "name": "Image",
            "description": "",
            "type": "image"
          }
        ],
        "flags": {
          "mFlagVR": true,
          "mFlagWebcam": false,
          "mFlagSoundInput": false,
          "mFlagSoundOutput": false,
          "mFlagKeyboard": false,
          "mFlagMultipass": false,
          "mFlagMusicStream": false
        },
        "info": {
          "id": "MsXXWH",
          "date": "1400161447",
          "viewed": 7020,
          "name": "Red Cells",
          "username": "P_Malin",
          "description": "Some red blood cells on an adventure.\nClick the mouse to rotate view.\n(Works in VR Mode)",
          "likes": 104,
          "published": 3,
          "flags": 9,
          "usePreview": 0,
          "tags": [
            "tunnel",
            "cells"
          ],
          "hasliked": 1,
          "parentid": "",
          "parentname": ""
        }
      }
];

compileAndStart(jsnShader);