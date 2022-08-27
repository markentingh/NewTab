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
                "id": "4sXGR8",
                "filepath": "/media/previz/buffer02.png",
                "sampler": {
                  "filter": "linear",
                  "wrap": "clamp",
                  "vflip": "true",
                  "srgb": "false",
                  "internal": "byte"
                }
              }
            ],
            "code": "// Bloom shader\n// by Morgan McGuire, @CasualEffects, http://casual-effects.com\n\nfloat square(int x) { return float(x * x); }\n\nvoid mainImage(out vec4 fragColor, in vec2 fragCoord) {\n    const int   blurRadius    = 5;\n    const float blurVariance  = 0.1 * float(blurRadius * blurRadius);    \n    vec2        invResolution = 1.0 / iResolution.xy;\n    \n    // Center tap\n    vec4 sum = vec4(texture(iChannel0, fragCoord.xy * invResolution).rgb * 13.0, 13.0);\n    \n    for (int dx = -blurRadius; dx < blurRadius; dx += 2) {\n        for (int dy = -blurRadius; dy < blurRadius; dy += 2) {\n            // Bilinear taps at pixel corners\n\t        vec3 src = texture(iChannel0, (fragCoord.xy + vec2(dx, dy) + 0.5) * invResolution).rgb;\n            float weight = exp2(-(square(dx) + square(dy)) / blurVariance);\n            sum += vec4(src, 1.0) * weight;\n        }\n    }\n    \n\tfragColor.xyz = pow(sum.rgb / sum.a, Color3(0.65));    \n}\n",
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
                "type": "cubemap",
                "id": "XsX3zn",
                "filepath": "/media/a/94284d43be78f00eb6b298e6d78656a1b34e2b91b34940d02f1ca8b22310e8a0.png",
                "sampler": {
                  "filter": "mipmap",
                  "wrap": "clamp",
                  "vflip": "true",
                  "srgb": "false",
                  "internal": "byte"
                }
              }
            ],
            "code": "// Planet implicit surface ray tracer\n// by Morgan McGuire, @CasualEffects, http://casual-effects.com\n//\n// Prototype for a new Graphics Codex programming project.\n//\n// The key functions are the scene() distance estimator in Buf A and\n// the renderClouds() shading in Buf B. Everything else is relatively \n// standard ray marching infrastructure.\n\nmat3 planetRotation;\n\nconst Material ROCK = Material(Color3(0.50, 0.35, 0.15), 0.0, 0.0);\nconst Material TREE = Material(Color3(0.05, 1.15, 0.10), 0.2, 0.1);\nconst Material SAND = Material(Color3(1.00, 1.00, 0.85), 0.0, 0.0);\nconst Material ICE  = Material(Color3(0.85, 1.00, 1.20), 0.2, 0.6);\n\n/**\n Conservative distance estimator for the entire scene. Returns true if\n the surface is closer than distance. Always updates distance and material.\n The material code compiles out when called from a context that ignores it.\n*/\nbool scene(Point3 X, inout float distance, inout Material material, const bool shadow) { \n    Material planetMaterial;\n    \n    // Move to the planet's reference frame (ideally, we'd just trace in the \n    // planet's reference frame and avoid these operations per distance\n    // function evaluation, but this makes it easy to integrate with a\n    // standard framework)\n    X = planetRotation * (X - planetCenter);\n    Point3 surfaceLocation = normalize(X);\n    \n    // Compute t = distance estimator to the planet surface using a spherical height field, \n    // in which elevation = radial distance\n    //\n\t// Estimate *conservative* distance as always less than that to the bounding sphere\n    // (i.e., push down). Work on range [0, 1], and then scale by planet radius at the end\n    \n\tfloat mountain = clamp(1.0 - fbm6(surfaceLocation * 4.0) + (max(abs(surfaceLocation.y) - 0.6, 0.0)) * 0.03, 0.0, 1.0);\n    mountain = pow3(mountain) * 0.25 + 0.8;\n    \n    const float water = 0.85;\n    float elevation = mountain;    \n    \n    Vector3 normal = normalize(cross(dFdx(surfaceLocation * mountain), dFdy(surfaceLocation * mountain)));\n    \n    // Don't pay for fine details in the shadow tracing pass\n\tif (! shadow) {\n        if (elevation < water) {\n            float relativeWaterDepth = min(1.0, (water - mountain) * 30.0);\n            const float waveMagnitude = 0.0014;\n            const float waveLength = 0.01;\n\n            // Create waves. Shallow-water waves conform to coasts. Deep-water waves follow global wind patterns.\n            const Color3 shallowWaterColor = Color3(0.4, 1.0, 1.9);\n            // How much the waves conform to beaches\n            const float shallowWaveRefraction = 4.0;        \n            float shallowWavePhase = (surfaceLocation.y - mountain * shallowWaveRefraction) * (1.0 / waveLength);\n\n            const Color3 deepWaterColor = Color3(0, 0.1, 0.7);\n            float deepWavePhase    = (atan(surfaceLocation.z, surfaceLocation.x) + noise(surfaceLocation * 15.0) * 0.075) * (1.5 / waveLength);\n\n            // This is like a lerp, but it gives a large middle region in which both wave types are active at nearly full magnitude\n            float wave =  (cos(shallowWavePhase + time * 1.5) * sqrt(1.0 - relativeWaterDepth) + \n                           cos(deepWavePhase + time * 2.0) * 2.5 * (1.0 - abs(surfaceLocation.y)) * square(relativeWaterDepth)) *\n                waveMagnitude;\n\n            elevation = water + wave;\n\n            // Set material, making deep water darker\n            planetMaterial = Material(mix(shallowWaterColor, deepWaterColor, pow(relativeWaterDepth, 0.4)), 0.5 * relativeWaterDepth, 0.7);\n\n            // Lighten polar water color\n            planetMaterial.color = mix(planetMaterial.color, Color3(0.7, 1.0, 1.2), square(clamp((abs(surfaceLocation.y) - 0.65) * 3.0, 0.0, 1.0)));            \n        } else {\n            float materialNoise = noise(surfaceLocation * 200.0);\n\n            float slope = clamp(2.0 * (1.0 - dot(normal, surfaceLocation)), 0.0, 1.0);\n\n            bool iceCap     = abs(surfaceLocation.y) + materialNoise * 0.2 > 0.98; \n            bool rock       = (elevation + materialNoise * 0.1 > 0.94) || (slope > 0.3);\n            bool mountainTop = (elevation + materialNoise * 0.05 - slope * 0.05) > (planetMaxRadius * 0.92);\n\n            // Beach\n            bool sand        = (elevation < water + 0.006) && (noise(surfaceLocation * 8.0) > 0.3);\n\n            // Equatorial desert\n            sand = sand || (elevation < 0.89) && \n                (noise(surfaceLocation * 1.5) * 0.15 + noise(surfaceLocation * 73.0) * 0.25 > abs(surfaceLocation.y));\n\n            if (rock) {\n                // Rock\n                planetMaterial = ROCK;\n            } else {\n                // Trees\n                planetMaterial = TREE;\n            }\n\n            if (iceCap || mountainTop) {\n                // Ice (allow to slightly exceed physical conservation in the blue channel\n                // to simulate subsurface effects)\n                planetMaterial = ICE;\n            } else if (! rock && sand) {\n                planetMaterial = SAND;\n            } else if (! rock && (iResolution.x > 420.0)) {\n                // High frequency bumps for trees when in medium resolution\n                elevation += noise(surfaceLocation * 150.0) * 0.02;\n            }\n\n            // Add high-frequency material detail\n            if (! sand && ! iceCap) {\n                planetMaterial.color *= mix(noise(surfaceLocation * 256.0), 1.0, 0.4);\n            }\n\n        }\n    }\n        \n    elevation *= planetMaxRadius;\n    \n    float sampleElevation = length(X);\n    float t = sampleElevation - elevation;\n    \n    // Be a little more conservative because a radial heightfield is not a great\n    // distance estimator.\n    t *= 0.8;\n        \n    // Compute output variables\n    bool closer = (t < distance);       \n    distance = closer ? t : distance;    \n    if (closer) { material = planetMaterial; }\n    return closer;    \n}\n\n\n// Version that ignores materials\nbool scene(Point3 X, inout float distance) {\n    Material ignoreMaterial;\n    return scene(X, distance, ignoreMaterial, true); \n}\n\nfloat distanceEstimator(Point3 X) {\n    float d = inf;\n    Material ignoreMaterial;\n    scene(X, d, ignoreMaterial, false);\n    return d;\n}\n\n// Weird structure needed because WebGL does not support BREAK in a FOR loop\nbool intersectSceneLoop(Ray R, float minDist, float maxDist, inout Surfel surfel) {\n    const int maxIterations = 75;\n    \n    // Making this too large causes bad results because we use\n    // screen-space derivatives for normal estimation.\n    \n    const float closeEnough = 0.0011;\n    const float minStep = closeEnough;\n    float closest = inf;\n    float tForClosest = 0.0;\n    float t = minDist;\n    \n    for (int i = 0; i < maxIterations; ++i) {\n        surfel.position = R.direction * t + R.origin;\n\n        float dt = inf;\n        scene(surfel.position, dt);\n        if (dt < closest) {            \n\t        closest = dt;\n            tForClosest = t;            \n        }\n        \n        t += max(dt, minStep);\n        if (dt < closeEnough) {\n            return true;\n        } else if (t > maxDist) {\n            return false;\n        }\n    }    \n\n    // \"Screen space\" optimization from Mercury for shading a reasonable\n    // point in the event of failure due to iteration count\n    if (closest < closeEnough * 5.0) {\n        surfel.position = R.direction * tForClosest + R.origin;\n        return true;\n    }\n    \n    return false;\n}\n\n\nbool intersectScene(Ray R, float minDist, float maxDist, inout Surfel surfel) {\n    if (intersectSceneLoop(R, minDist, maxDist, surfel)) {\n        const float eps = 0.0001;\n        \n        float d = inf;\n        scene(surfel.position, d, surfel.material, false);\n        surfel.normal =\n            normalize(Vector3(distanceEstimator(surfel.position + Vector3(eps, 0, 0)), \n                              distanceEstimator(surfel.position + Vector3(0, eps, 0)), \n                              distanceEstimator(surfel.position + Vector3(0, 0, eps))) - \n                              d);\n        return true;\n    } else {\n        return false;\n    }\n}\n\n\nbool shadowed(Ray R, float minDist, float maxDist) {\n    const int maxIterations = 30;    \n    const float closeEnough = 0.0011 * 4.0;\n    const float minStep = closeEnough;\n    float t = 0.0;\n    \n    for (int i = 0; i < maxIterations; ++i) {\n        float dt = inf;\n        scene(R.direction * t + R.origin, dt);        \n        t += max(dt, minStep);\n        if (dt < closeEnough) {\n            return true;\n        } else if (t > maxDist) {\n            return false;\n        }\n    }\n    \n    return false;\n}\n\n\n\nvoid computeReflectivities(Material material, out Color3 p_L, out Color3 p_G, out float glossyExponent) {\n\tp_L = mix(material.color, Color3(0.0), material.metal);\n\tp_G = mix(Color3(0.04), material.color, material.metal);\n\tglossyExponent = exp2(material.smoothness * 15.0);\n}\n\n\nRadiance3 shade(Surfel surfel, Vector3 w_i, Vector3 w_o, Biradiance3 B_i) {\n\tVector3 n   = surfel.normal;\n    \n    float cos_i = dot(n, w_i);\n    if (cos_i < 0.0) {\n        // Backface, don't bother shading or shadow casting\n        return Radiance3(0.0);\n    }\n    \n    // Cast a shadow ray\n    Ray shadowRay = Ray(surfel.position + (surfel.normal + w_o) * 0.003, w_i);\n    float shadowDist, ignore;\n    // Find the outer bounding sphere on the atmosphere and trace shadows up to it\n    intersectSphere(planetCenter, planetMaxRadius, shadowRay, shadowDist, ignore);\n    if (shadowed(shadowRay, 0.0, shadowDist)) {\n        return Radiance3(0.0);\n    }\n    \n\tColor3 p_L, p_G;\n\tfloat glossyExponent;\n\tcomputeReflectivities(surfel.material, p_L, p_G, glossyExponent);\n\n\t// Compute the light contribution from the directional source\n\tVector3 w_h = normalize(w_i + w_o);\n\treturn cos_i * B_i * \n\t\t// Lambertian\n\t\t(p_L * (1.0 / pi) + \n\n\t\t// Glossy\n        pow(max(0.0, dot(n, w_h)), glossyExponent) * p_G * (glossyExponent + 8.0) / (14.0 * pi));\n}\n\n\n/** Returns true if the world-space ray hits the planet */\nbool renderPlanet(Ray eyeRay, float minDistanceToPlanet, float maxDistanceToPlanet, inout Radiance3 L_o, inout Point3 hitPoint) {    \n    Surfel surfel;\n    \n    if (intersectScene(eyeRay, minDistanceToPlanet, maxDistanceToPlanet, surfel)) {\n        // Render the planet\n        Radiance3 L_directOut = shade(surfel, w_i, -eyeRay.direction, B_i);\n\n        // Clouds vary fairly slowly in elevation, so we can just measure at the\n        // surface as an estimate of the density above the surface\n        float cloudShadow = pow4(1.0 - clamp(cloudDensity(surfel.position, time), 0.0, 1.0));\n        \n        // \"Ambient\"\n        Irradiance3 E_indirectIn = max(Irradiance3(0), Irradiance3(0.4) - 0.4 * Irradiance3(surfel.normal.yxx)); \n        Radiance3 L_indirectOut = \n            mix(E_indirectIn * surfel.material.color,\n                mix(Color3(1.0), surfel.material.color, surfel.material.metal) * texture(iChannel0, reflect(w_i, surfel.normal)).rgb * 2.7, surfel.material.smoothness) * (1.0 / pi);\n        \n        hitPoint = surfel.position;\n        L_o = (L_directOut + L_indirectOut) * cloudShadow;\n\n        if (debugMaterials) {\n            L_o = surfel.material.color;\n        }\n            \n        return true;\n    } else {\n        // Missed the bounding sphere or final ray-march\n        return false;\n    }    \n}\n\n\n\nvoid mainImage(out vec4 fragColor, in vec2 fragCoord) {\n\t// Rotate over time\n\tfloat yaw   = -((iMouse.x / iResolution.x) * 2.5 - 1.25) + (autoRotate ? -time * 0.015 : 0.0);\n\tfloat pitch = ((iMouse.y > 0.0 ? iMouse.y : iResolution.y * 0.3) / iResolution.y) * 2.5 - 1.25;\n \tplanetRotation = \n    \tmat3(cos(yaw), 0, -sin(yaw), 0, 1, 0, sin(yaw), 0, cos(yaw)) *\n    \tmat3(1, 0, 0, 0, cos(pitch), sin(pitch), 0, -sin(pitch), cos(pitch));\n\n    \n    Vector2 invResolution = 1.0 / iResolution.xy;\n\t\n\t// Outgoing light\n\tRadiance3 L_o;\n\t\n\tSurfel surfel;\t\n\t\n\tRay eyeRay = Ray(Point3(0.0, 0.0, 5.0), normalize(Vector3(fragCoord.xy - iResolution.xy / 2.0, iResolution.y / (-2.0 * tan(verticalFieldOfView / 2.0)))));\n\t    \n    Point3 hitPoint;    \n    float minDistanceToPlanet, maxDistanceToPlanet;\n        \n    bool hitBounds = (showClouds || showPlanet) && intersectSphere(planetCenter, planetMaxRadius, eyeRay, minDistanceToPlanet, maxDistanceToPlanet);\n\n    Color3 shadowedAtmosphere = shadowedAtmosphereColor(fragCoord, iResolution, 0.5);\n    \n    if (hitBounds && renderPlanet(eyeRay, minDistanceToPlanet, maxDistanceToPlanet, L_o, hitPoint)) {\n        // Tint planet with atmospheric scattering\n        L_o = mix(L_o, shadowedAtmosphere, min(0.8, square(1.0 - (hitPoint.z - planetCenter.z) * (1.0 / planetMaxRadius))));\n        // Update distance\n        maxDistanceToPlanet = min(maxDistanceToPlanet, dot(eyeRay.direction, hitPoint - eyeRay.origin));\n    } else if (showBackground) {\n        // Background starfield\n        float galaxyClump = (pow(noise(fragCoord.xy * (30.0 * invResolution.x)), 3.0) * 0.5 +\n            pow(noise(100.0 + fragCoord.xy * (15.0 * invResolution.x)), 5.0)) / 1.5;\n        L_o = Color3(galaxyClump * pow(hash(fragCoord.xy), 1500.0) * 80.0);\n        \n        // Color stars\n        L_o.r *= sqrt(noise(fragCoord.xy) * 1.2);\n        L_o.g *= sqrt(noise(fragCoord.xy * 4.0));\n        \n        // Twinkle\n        L_o *= noise(time * 0.5 + fragCoord.yx * 10.0);\n        vec2 delta = (fragCoord.xy - iResolution.xy * 0.5) * invResolution.y * 1.1;\n        float atmosphereRadialAttenuation = min(1.0, 0.06 * pow8(max(0.0, 1.0 - (length(delta) - 0.9) / 0.9)));\n        \n        // Gradient around planet\n        float radialNoise = mix(1.0, noise(normalize(delta) * 40.0 + iTime * 0.5), 0.14);\n        L_o += radialNoise * atmosphereRadialAttenuation * shadowedAtmosphere;\n    }   \n        \n\tfragColor.xyz = L_o;\n    fragColor.a   = maxDistanceToPlanet;\n}\n",
            "name": "Buffer A",
            "description": "",
            "type": "buffer"
          },
          {
            "outputs": [
              {
                "channel": 0,
                "id": "XsXGR8"
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
            "code": "// Cloud ray-march shader\n// by Morgan McGuire, @CasualEffects, http://casual-effects.com\n\n\n/** Computes the contribution of the clouds on [minDist, maxDist] along eyeRay towards net radiance \n    and composites it over background */\nRadiance4 renderClouds(Ray eyeRay, float minDist, float maxDist, Color3 shadowedAtmosphere) {    \n    const int    maxSteps = 80;\n    const float  stepSize = 0.012;\n    const Color3 cloudColor = Color3(0.95);\n    const Radiance3 ambient = Color3(0.9, 1.0, 1.0);\n\n    // The planet should shadow clouds on the \"bottom\"...but apply wrap shading to this term and add ambient\n    float planetShadow = clamp(0.4 + dot(w_i, normalize(eyeRay.origin + eyeRay.direction * minDist)), 0.25, 1.0);\n\n    Radiance4 result = Radiance4(0.0);\n    \n    // March towards the eye, since we wish to accumulate shading.\n    float t = maxDist;\n    for (int i = 0; i < maxSteps; ++i) {\n        if (t > minDist) {\n            Point3 X = ((eyeRay.direction * t + eyeRay.origin) - planetCenter) * (1.0 / planetMaxRadius);\n            // Sample the clouds at X\n            float density = cloudDensity(X, time);\n            \n            if (density > 0.0) {\n\n                // Shade cloud\n                // Use a directional derivative https://iquilezles.org/articles/derivative\n                // for efficiency in computing a directional term             \n                const float eps = stepSize;\n                float wrapShading = clamp(-(cloudDensity(X + w_i * eps, time) - density) * (1.0 / eps), -1.0, 1.0) * 0.5 + 0.5;\n\n                // Darken the portion of the cloud facing towards the planet\n                float AO = pow8((dot(X, X) - 0.5) * 2.0);\n                Radiance3 L_o = cloudColor * (B_i * planetShadow * wrapShading * mix(1.0, AO, 0.5) + ambient * AO);\n                \n                // Atmosphere tinting\n\t\t        L_o = mix(L_o, shadowedAtmosphere, min(0.5, square(max(0.0, 1.0 - X.z))));\n\n                // Fade in at the elevation edges of the cloud layer (do this *after* using density for derivative)\n                density *= square(1.0 - abs(2.0 * length(X - planetCenter) - (cloudMinRadius + planetMaxRadius)) * (1.0 / (planetMaxRadius - cloudMinRadius)));\n                \n                // Composite over result as premultiplied radiance\n                result = mix(result, Radiance4(L_o, 1.0), density);\n                \n                // Step more slowly through empty space\n\t            t += stepSize * 2.0;\n            } \n            \n            t -= stepSize * 3.0;\n        } else {\n            return result;\n        }\n    }\n    \n    return result;\n}\n\n\nvoid mainImage(out vec4 fragColor, in vec2 fragCoord) {\n    fragColor = vec4(0.0);\n    \n    // Run at 1/3 resolution\n    fragCoord.xy = (fragCoord.xy - 0.5) * 3.0 + 0.5;\n    if ((fragCoord.x > iResolution.x) || (fragCoord.y > iResolution.y)) { return; }\n    \n    Ray eyeRay = Ray(Point3(0.0, 0.0, 5.0), normalize(Vector3(fragCoord.xy - iResolution.xy / 2.0, iResolution.y / (-2.0 * tan(verticalFieldOfView / 2.0)))));\n\n    float minDistanceToPlanet, maxDistanceToPlanet;\n    if (showClouds && intersectSphere(planetCenter, planetMaxRadius, eyeRay, minDistanceToPlanet, maxDistanceToPlanet)) {\n        // This ray hits the cloud layer, so ray march the clouds\n        \n        // Find the hit point on the planet or back of cloud sphere and override\n        // the analytic max distance with it.\n    \tmaxDistanceToPlanet = texture(iChannel0, fragCoord.xy / iResolution.xy).a;\n        \n        Color3 shadowedAtmosphere = 1.1 * shadowedAtmosphereColor(fragCoord, iResolution, 0.08);\n        fragColor = renderClouds(eyeRay, minDistanceToPlanet, maxDistanceToPlanet, shadowedAtmosphere);   \n    }\n}",
            "name": "Buffer B",
            "description": "",
            "type": "buffer"
          },
          {
            "outputs": [
              {
                "channel": 0,
                "id": "4sXGR8"
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
              },
              {
                "channel": 1,
                "type": "buffer",
                "id": "XsXGR8",
                "filepath": "/media/previz/buffer01.png",
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
                "type": "buffer",
                "id": "4sXGR8",
                "filepath": "/media/previz/buffer02.png",
                "sampler": {
                  "filter": "linear",
                  "wrap": "clamp",
                  "vflip": "true",
                  "srgb": "false",
                  "internal": "byte"
                }
              }
            ],
            "code": "// Composite and temporal blur shader\n// by Morgan McGuire, @CasualEffects, http://casual-effects.com\n\nvoid mainImage(out vec4 fragColor, in vec2 fragCoord) {\n    float mouseDeltaX = iMouse.x - texture(iChannel2, vec2(0, 0)).a; \n    \n    // Increase blur constants when small because the screen-space derivatives\n    // will be unstable at that scale. Both are on [0, 1]\n    float hysteresis    = (abs(mouseDeltaX) > 1.0) ? 0.05 : \n        (iResolution.x > 800.0) ? 0.8 : 0.9;\n    float spatialBlur   = (iResolution.x > 900.0) ? 0.70 : 0.90;\n\n    vec2 invResolution = 1.0 / iResolution.xy;\n    vec3 planet = texture(iChannel0, (fragCoord.xy + spatialBlur * 0.5) * invResolution).rgb;\n    // Upsample clouds from 1/2 resolution\n    vec4 clouds = texture(iChannel1, ((fragCoord.xy - 0.5) / 3.0 + 0.5) * invResolution);\n    vec3 dst    = texture(iChannel2, fragCoord.xy * invResolution).rgb;\n    \n\t// Hide clouds\n   \t// clouds = vec4(0.0); hysteresis = 0.0;\n    \n    if (! showPlanet) { planet *= 0.0; }\n    \n\tfragColor.rgb = mix(planet * (1.0 - clouds.a) + clouds.rgb, dst, hysteresis);\n\n    // Save the old mouse position. Most users only rotate horizontally, so save\n    // a texture fetch on read by not storing the y component.\n    fragColor.a   = iMouse.x;   \n}\n",
            "name": "Buffer C",
            "description": "",
            "type": "buffer"
          },
          {
            "outputs": [],
            "inputs": [],
            "code": "const bool autoRotate = true;\n\nconst bool showBackground = true;\nconst bool showPlanet = true;\nconst bool showClouds = true;\n\nconst bool debugMaterials = false;\n    \n#define time (iTime)\n\n\n///////////////////////////////////////////////////////////////////////////////////\n// Morgan's standard Shadertoy helpers\n#define Vector2      vec2\n#define Point3       vec3\n#define Vector3      vec3\n#define Color3       vec3\n#define Radiance3    vec3\n#define Radiance4    vec4\n#define Irradiance3  vec3\n#define Power3       vec3\n#define Biradiance3  vec3\n\nconst float pi          = 3.1415926535;\nconst float degrees     = pi / 180.0;\nconst float inf         = 1.0 / 1e-10;\n\nfloat square(float x) { return x * x; }\nfloat pow3(float x) { return x * square(x); }\nfloat pow4(float x) { return square(square(x)); }\nfloat pow8(float x) { return square(pow4(x)); }\nfloat pow5(float x) { return x * square(square(x)); }\nfloat infIfNegative(float x) { return (x >= 0.0) ? x : inf; }\n\nstruct Ray { Point3 origin; Vector3 direction; };\t\nstruct Material { Color3 color; float metal; float smoothness; };\nstruct Surfel { Point3 position; Vector3 normal; Material material; };\nstruct Sphere { Point3 center; float radius; Material material; };\n   \n/** Analytic ray-sphere intersection. */\nbool intersectSphere(Point3 C, float r, Ray R, inout float nearDistance, inout float farDistance) { Point3 P = R.origin; Vector3 w = R.direction; Vector3 v = P - C; float b = 2.0 * dot(w, v); float c = dot(v, v) - square(r); float d = square(b) - 4.0 * c; if (d < 0.0) { return false; } float dsqrt = sqrt(d); float t0 = infIfNegative((-b - dsqrt) * 0.5); float t1 = infIfNegative((-b + dsqrt) * 0.5); nearDistance = min(t0, t1); farDistance  = max(t0, t1); return (nearDistance < inf); }\n\n///////////////////////////////////////////////////////////////////////////////////\n// The following are from https://www.shadertoy.com/view/4dS3Wd\nfloat hash(float p) { p = fract(p * 0.011); p *= p + 7.5; p *= p + p; return fract(p); }\nfloat hash(vec2 p) {vec3 p3 = fract(vec3(p.xyx) * 0.13); p3 += dot(p3, p3.yzx + 3.333); return fract((p3.x + p3.y) * p3.z); }\nfloat noise(float x) { float i = floor(x); float f = fract(x); float u = f * f * (3.0 - 2.0 * f); return mix(hash(i), hash(i + 1.0), u); }\nfloat noise(vec2 x) { vec2 i = floor(x); vec2 f = fract(x); float a = hash(i); float b = hash(i + vec2(1.0, 0.0)); float c = hash(i + vec2(0.0, 1.0)); float d = hash(i + vec2(1.0, 1.0)); vec2 u = f * f * (3.0 - 2.0 * f); return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y; }\nfloat noise(vec3 x) { const vec3 step = vec3(110, 241, 171); vec3 i = floor(x); vec3 f = fract(x); float n = dot(i, step); vec3 u = f * f * (3.0 - 2.0 * f); return mix(mix(mix( hash(n + dot(step, vec3(0, 0, 0))), hash(n + dot(step, vec3(1, 0, 0))), u.x), mix( hash(n + dot(step, vec3(0, 1, 0))), hash(n + dot(step, vec3(1, 1, 0))), u.x), u.y), mix(mix( hash(n + dot(step, vec3(0, 0, 1))), hash(n + dot(step, vec3(1, 0, 1))), u.x), mix( hash(n + dot(step, vec3(0, 1, 1))), hash(n + dot(step, vec3(1, 1, 1))), u.x), u.y), u.z); }\n\n#define DEFINE_FBM(name, OCTAVES) float name(vec3 x) { float v = 0.0; float a = 0.5; vec3 shift = vec3(100); for (int i = 0; i < OCTAVES; ++i) { v += a * noise(x); x = x * 2.0 + shift; a *= 0.5; } return v; }\nDEFINE_FBM(fbm3, 3)\nDEFINE_FBM(fbm5, 5)\nDEFINE_FBM(fbm6, 6)\n    \n///////////////////////////////////////////////////////////////////////////////////\n\nconst float       verticalFieldOfView = 25.0 * degrees;\n\n// Directional light source\nconst Vector3     w_i             = Vector3(1.0, 1.3, 0.6) / 1.7464;\nconst Biradiance3 B_i             = Biradiance3(2.9);\n\nconst Point3      planetCenter    = Point3(0);\n\n// Including clouds\nconst float       planetMaxRadius = 1.0;\n\nconst float       cloudMinRadius  = 0.85;\n\nconst Radiance3   atmosphereColor = Color3(0.3, 0.6, 1.0) * 1.6;\n\n\n// This can g1 negative in order to make derivatives smooth. Always\n// clamp before using as a density. Must be kept in sync with Buf A code.\nfloat cloudDensity(Point3 X, float t) {\n    Point3 p = X * vec3(1.5, 2.5, 2.0);\n\treturn fbm5(p + 1.5 * fbm3(p - t * 0.047) - t * vec3(0.03, 0.01, 0.01)) - 0.42;\n}\n\nColor3 shadowedAtmosphereColor(vec2 fragCoord, vec3 iResolution, float minVal) {\n    vec2 rel = 0.65 * (fragCoord.xy - iResolution.xy * 0.5) / iResolution.y;\n    const float maxVal = 1.0;\n    \n    float a = min(1.0,\n                  pow(max(0.0, 1.0 - dot(rel, rel) * 6.5), 2.4) + \n                  max(abs(rel.x - rel.y) - 0.35, 0.0) * 12.0 +                   \n\t              max(0.0, 0.2 + dot(rel, vec2(2.75))) + \n                  0.0\n                 );\n    \n    float planetShadow = mix(minVal, maxVal, a);\n    \n    return atmosphereColor * planetShadow;\n\n}\n",
            "name": "Common",
            "description": "",
            "type": "common"
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
          "id": "lt3XDM",
          "date": "1480078164",
          "viewed": 28732,
          "name": "Tiny Planet: Earth",
          "username": "morgan3d",
          "description": "Earth-like planet with exaggerated features. A fbm value-noise implicit surface with shallow + deep water wave simulation, clouds, trees, mountains, desert, beaches, snow, polar caps, denoising, bloom, atmospheric scattering, and star field.\n",
          "likes": 387,
          "published": 1,
          "flags": 32,
          "usePreview": 1,
          "tags": [
            "waves",
            "clouds",
            "planet",
            "implicitsurface"
          ],
          "hasliked": 1,
          "parentid": "",
          "parentname": ""
        }
      }
];

compileAndStart(jsnShader);