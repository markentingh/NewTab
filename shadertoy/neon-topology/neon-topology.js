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
            "code": "// implementation of MurmurHash (https://sites.google.com/site/murmurhash/) for a \n// single unsigned integer.\n\nuint hash(uint x, uint seed) {\n    const uint m = 0x5bd1e995U;\n    uint hash = seed;\n    // process input\n    uint k = x;\n    k *= m;\n    k ^= k >> 24;\n    k *= m;\n    hash *= m;\n    hash ^= k;\n    // some final mixing\n    hash ^= hash >> 13;\n    hash *= m;\n    hash ^= hash >> 15;\n    return hash;\n}\n\n// implementation of MurmurHash (https://sites.google.com/site/murmurhash/) for a  \n// 3-dimensional unsigned integer input vector.\n\nuint hash(uvec3 x, uint seed){\n    const uint m = 0x5bd1e995U;\n    uint hash = seed;\n    // process first vector element\n    uint k = x.x; \n    k *= m;\n    k ^= k >> 24;\n    k *= m;\n    hash *= m;\n    hash ^= k;\n    // process second vector element\n    k = x.y; \n    k *= m;\n    k ^= k >> 24;\n    k *= m;\n    hash *= m;\n    hash ^= k;\n    // process third vector element\n    k = x.z; \n    k *= m;\n    k ^= k >> 24;\n    k *= m;\n    hash *= m;\n    hash ^= k;\n\t// some final mixing\n    hash ^= hash >> 13;\n    hash *= m;\n    hash ^= hash >> 15;\n    return hash;\n}\n\n\nvec3 gradientDirection(uint hash) {\n    switch (int(hash) & 15) { // look at the last four bits to pick a gradient direction\n    case 0:\n        return vec3(1, 1, 0);\n    case 1:\n        return vec3(-1, 1, 0);\n    case 2:\n        return vec3(1, -1, 0);\n    case 3:\n        return vec3(-1, -1, 0);\n    case 4:\n        return vec3(1, 0, 1);\n    case 5:\n        return vec3(-1, 0, 1);\n    case 6:\n        return vec3(1, 0, -1);\n    case 7:\n        return vec3(-1, 0, -1);\n    case 8:\n        return vec3(0, 1, 1);\n    case 9:\n        return vec3(0, -1, 1);\n    case 10:\n        return vec3(0, 1, -1);\n    case 11:\n        return vec3(0, -1, -1);\n    case 12:\n        return vec3(1, 1, 0);\n    case 13:\n        return vec3(-1, 1, 0);\n    case 14:\n        return vec3(0, -1, 1);\n    case 15:\n        return vec3(0, -1, -1);\n    }\n}\n\nfloat interpolate(float value1, float value2, float value3, float value4, float value5, float value6, float value7, float value8, vec3 t) {\n    return mix(\n        mix(mix(value1, value2, t.x), mix(value3, value4, t.x), t.y),\n        mix(mix(value5, value6, t.x), mix(value7, value8, t.x), t.y),\n        t.z\n    );\n}\n\nvec3 fade(vec3 t) {\n    // 6t^5 - 15t^4 + 10t^3\n\treturn t * t * t * (t * (t * 6.0 - 15.0) + 10.0);\n}\n\nfloat perlinNoise(vec3 position, uint seed) {\n    vec3 floorPosition = floor(position);\n    vec3 fractPosition = position - floorPosition;\n    uvec3 cellCoordinates = uvec3(floorPosition);\n    float value1 = dot(gradientDirection(hash(cellCoordinates, seed)), fractPosition);\n    float value2 = dot(gradientDirection(hash((cellCoordinates + uvec3(1, 0, 0)), seed)), fractPosition - vec3(1, 0, 0));\n    float value3 = dot(gradientDirection(hash((cellCoordinates + uvec3(0, 1, 0)), seed)), fractPosition - vec3(0, 1, 0));\n    float value4 = dot(gradientDirection(hash((cellCoordinates + uvec3(1, 1, 0)), seed)), fractPosition - vec3(1, 1, 0));\n    float value5 = dot(gradientDirection(hash((cellCoordinates + uvec3(0, 0, 1)), seed)), fractPosition - vec3(0, 0, 1));\n    float value6 = dot(gradientDirection(hash((cellCoordinates + uvec3(1, 0, 1)), seed)), fractPosition - vec3(1, 0, 1));\n    float value7 = dot(gradientDirection(hash((cellCoordinates + uvec3(0, 1, 1)), seed)), fractPosition - vec3(0, 1, 1));\n    float value8 = dot(gradientDirection(hash((cellCoordinates + uvec3(1, 1, 1)), seed)), fractPosition - vec3(1, 1, 1));\n    return interpolate(value1, value2, value3, value4, value5, value6, value7, value8, fade(fractPosition));\n}\n\nfloat perlinNoise(vec3 position, int frequency, int octaveCount, float persistence, float lacunarity, uint seed) {\n    float value = 0.0;\n    float amplitude = 1.0;\n    float currentFrequency = float(frequency);\n    uint currentSeed = seed;\n    for (int i = 0; i < octaveCount; i++) {\n        currentSeed = hash(currentSeed, 0x0U); // create a new seed for each octave\n        value += perlinNoise(position * currentFrequency, currentSeed) * amplitude;\n        amplitude *= persistence;\n        currentFrequency *= lacunarity;\n    }\n    return value;\n}\n\nfloat lum(vec3 c) {\n    return (c[0]*0.3) + (c[1]*0.59) + (c[2]*.11);\n}\n\nvoid mainImage(out vec4 fragColor, in vec2 fragCoord) {\n\n    vec3 colors[10] = vec3[10](\n      vec3(1.0, 0.0, 0.0),        \n      vec3(1.0, 1.0, 0.0),\n      vec3(1.0, 0.0, 1.0),\n      vec3(0.0, 1.0, 0.0),\n      vec3(0.0, 1.0, 1.0),\n      vec3(0.0, 0.0, 1.0),\n      vec3(1.0, 1.0, 1.0),\n      vec3(0.0, 0.0, 0.0),\n      vec3(0.0, 0.5, 0.5),\n      vec3(0.5, 0.5, 0.0)\n    ); \n\n    vec2 post = vec2(fragCoord[0], fragCoord[1] - 1.0) / iResolution.xy;\n    vec2 pos  = fragCoord / iResolution.xy;\n    vec2 posb = vec2(fragCoord.x, fragCoord.y + 1.0) / iResolution.xy;\n    vec2 posl = vec2(fragCoord.x - 1.0, fragCoord.y) / iResolution.xy;\n    vec2 posr = vec2(fragCoord.x + 1.0, fragCoord.y) / iResolution.xy;\n\n    pos.x *= iResolution.x / iResolution.y;\n    post.x *= iResolution.x / iResolution.y;\n    posb.x *= iResolution.x / iResolution.y;\n    posl.x *= iResolution.x / iResolution.y;\n    posr.x *= iResolution.x / iResolution.y;\n    uint seed = 0x578437adU; // can be set to something else if you want a different set of random values\n    float z = iTime * 0.01;\n    int freq = 7;\n    int octave = 3;\n    float persistence = 0.5;\n    float lacunarity = 2.0;\n    // float frequency = 16.0;\n    // float value = perlinNoise(position * frequency, seed); // single octave perlin noise\n    \n    float valueback = perlinNoise(vec3(pos + vec2(100.0,100.0), z), freq, octave, persistence, lacunarity, seed); // multiple octaves\n    valueback = (valueback + 1.0) * 0.5;\n    \n    float value = perlinNoise(vec3(pos, z), freq, octave, persistence, lacunarity, seed); // multiple octaves\n    value = (value + 1.0) * 0.5;\n    value = floor(value * 10.0) / 10.0;\n    \n    float valuet = perlinNoise(vec3(post, z), freq, octave, persistence, lacunarity, seed); // multiple octaves\n    valuet = (valuet + 1.0) * 0.5;\n    valuet = floor(valuet * 10.0) / 10.0;\n    \n    float valueb = perlinNoise(vec3(posb, z), freq, octave, persistence, lacunarity, seed); // multiple octaves\n    valueb = (valueb + 1.0) * 0.5;\n    valueb = floor(valueb * 10.0) / 10.0;\n    \n    float valuel = perlinNoise(vec3(posl, z), freq, octave, persistence, lacunarity, seed); // multiple octaves\n    valuel = (valuel + 1.0) * 0.5;\n    valuel = floor(valuel * 10.0) / 10.0;\n    \n    float valuer = perlinNoise(vec3(posr, z), freq, octave, persistence, lacunarity, seed); // multiple octaves\n    valuer = (valuer + 1.0) * 0.5;\n    valuer = floor(valuer * 10.0) / 10.0;\n    \n    float lumc = lum(vec3(value));\n    float lumt = lum(vec3(valuet));    \n    float lumb = lum(vec3(valueb));    \n    float luml = lum(vec3(valuel));\n    float lumr = lum(vec3(valuer));\n    \n    vec3 purple = vec3(1.0, 0.0, 1.0);    \n    vec3 cyan = vec3(0.0, 1.0, 1.0);\n\n    \n    float lap = lumt + lumb + lumr + luml - (4.0 * lumc);\n    if (lap > .01) lap = 1.0;\n    vec3 res = ((purple * valueback) * lap) + ((cyan * (1.0 - valueback)) * lap);\n    res = res + (value * vec3(0.0, 0.0, 0.2));\n    fragColor = vec4(vec3(res), 1.0);\n}",
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
          "id": "dtccWB",
          "date": "1699585753",
          "viewed": 113,
          "name": "Neon Topology",
          "username": "advanderar",
          "description": "Edge detected Perlin noise with vaporwave gradients, Laplacian",
          "likes": 8,
          "published": 1,
          "flags": 0,
          "usePreview": 0,
          "tags": [
            "perlinnoise",
            "edgedetection",
            "vaporwave"
          ],
          "hasliked": 0,
          "parentid": "",
          "parentname": ""
        }
      }
];

compileAndStart(jsnShader);