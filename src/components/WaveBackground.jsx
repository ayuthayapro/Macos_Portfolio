import { useEffect, useRef } from "react";

// ==========================================
// 🎛️ WAVE GRADIENT CONFIGURATION
// You can edit colors, angles, speed & brightness here:
// ==========================================
export const WAVE_CONFIG = {
    // 🎨 4 Colors: [R (0-1), G (0-1), B (0-1), Alpha (0-1)]
    colors: [
        [10 / 255, 130 / 255, 255 / 255, 1.0], // Color 1: Apple Blue rgb(10, 130, 255)
        [0 / 255, 97 / 255, 201 / 255, 1.0],   // Color 2: Deep Blue rgb(0, 97, 201)
        [51 / 255, 162 / 255, 196 / 255, 0.1], // Color 3: 10% Cerulean rgba(51, 162, 196, 0.1)
        [120 / 255, 177 / 255, 194 / 255, 1.0],// Color 4: Sky Cyan rgb(120, 177, 194)
    ],
    seed: 81,            // Seed number (changes wave patterns)
    waveSpeed: 0.14,     // Animation speed (0.1 - 2.0)
    waveFreqX: 1.1,      // Horizontal frequency
    waveFreqY: 4.1,      // Vertical frequency
    waveAngle: 150,      // Diagonal wave angle in degrees (0 - 360)
    waveAmplitude: 3.0,  // Wave height/strength
    maskSoftness: 2.0,   // Gradient softness
    blendAmount: 1.0,    // Color blend intensity
    
    // ☀️ BRIGHTNESS / EXPOSURE CONTROL:
    brightness: 0.95,

    // ⚡ Performance / Resolution scale (0.75 - 1.0)
    resolutionScale: 1,
};

// 💾 SAVED ROLLBACK PRESET (Preserved as requested)
export const SAVED_ROLLBACK_PRESET = {
    colors: [
        [10 / 255, 130 / 255, 255 / 255, 1.0],
        [0 / 255, 97 / 255, 201 / 255, 1.0],
        [51 / 255, 162 / 255, 196 / 255, 0.1],
        [120 / 255, 177 / 255, 194 / 255, 1.0],
    ],
    seed: 81,
    waveSpeed: 0.15,
    waveFreqX: 1.1,
    waveFreqY: 4.1,
    waveAngle: 150,
    waveAmplitude: 3.0,
    maskSoftness: 2.0,
    blendAmount: 1.0,
    brightness: 0.9,
    resolutionScale: 1,
};

const WaveBackground = ({ config = WAVE_CONFIG }) => {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        // High-performance WebGL2 context
        const gl = canvas.getContext("webgl2", {
            alpha: false,
            antialias: false,
            depth: false,
            stencil: false,
            desynchronized: true,
            powerPreference: "high-performance",
        }) || canvas.getContext("webgl", {
            alpha: false,
            antialias: false,
            depth: false,
            stencil: false,
            powerPreference: "high-performance",
        });

        if (!gl) {
            console.warn("WebGL not supported.");
            return;
        }

        const isWebGL2 = typeof WebGL2RenderingContext !== "undefined" && gl instanceof WebGL2RenderingContext;

        const vsSource = isWebGL2
            ? `#version 300 es
                in vec2 a_position;
                out vec2 v_uv;
                void main() {
                    v_uv = a_position * 0.5 + 0.5;
                    gl_Position = vec4(a_position, 0.0, 1.0);
                }`
            : `attribute vec2 a_position;
                varying vec2 v_uv;
                void main() {
                    v_uv = a_position * 0.5 + 0.5;
                    gl_Position = vec4(a_position, 0.0, 1.0);
                }`;

        // Exact Framer Wave Gradient GLSL Shader
        const fsSource = isWebGL2
            ? `#version 300 es
                precision highp float;
                in vec2 v_uv;
                out vec4 fragColor;

                uniform vec2 u_resolution;
                uniform float u_time;
                uniform vec4 u_colors[4];
                uniform int u_colors_length;
                uniform float u_seed;
                uniform float u_waveSpeed;
                uniform float u_waveFreqX;
                uniform float u_waveFreqY;
                uniform float u_waveAngle;
                uniform float u_waveAmplitude;
                uniform float u_maskSoftness;
                uniform float u_blendAmount;
                uniform float u_brightness;

                #define S(a,b,t) smoothstep(a,b,t)

                mat2 Rot(float a) {
                    float s = sin(a), c = cos(a);
                    return mat2(c, -s, s, c);
                }

                vec2 hash(vec2 p) {
                    float s = u_seed;
                    vec2 k1 = vec2(2127.1 + s * 13.37, 81.17 + s * 7.31);
                    vec2 k2 = vec2(1269.5 + s * 11.13, 283.37 + s * 5.79);
                    p = vec2(dot(p, k1), dot(p, k2));
                    return fract(sin(p) * (43758.5453 + s * 1.618));
                }

                float noise(in vec2 p) {
                    vec2 i = floor(p);
                    vec2 f = fract(p);
                    vec2 u = f * f * (3.0 - 2.0 * f);
                    float n = mix(
                        mix(dot(-1.0 + 2.0 * hash(i), f),
                            dot(-1.0 + 2.0 * hash(i + vec2(1.0, 0.0)), f - vec2(1.0, 0.0)), u.x),
                        mix(dot(-1.0 + 2.0 * hash(i + vec2(0.0, 1.0)), f - vec2(0.0, 1.0)),
                            dot(-1.0 + 2.0 * hash(i + vec2(1.0, 1.0)), f - vec2(1.0, 1.0)), u.x),
                        u.y
                    );
                    return 0.5 + 0.5 * n;
                }

                vec3 getColor(int idx) {
                    if (u_colors_length < 1) return vec3(0.0);
                    int safeIdx = clamp(idx, 0, u_colors_length - 1);
                    return u_colors[safeIdx].rgb;
                }

                float seedF(float base) {
                    return base * (1.0 + 0.5 * sin(u_seed * 3.17 + base));
                }

                vec2 warpUV(vec2 uv) {
                    float t = u_time * u_waveSpeed;

                    float angleOffset = sin(u_seed * 2.73) * 30.0;
                    mat2 dirRot = Rot(radians(u_waveAngle + angleOffset));
                    vec2 ruv = dirRot * uv;

                    float fxMod = seedF(u_waveFreqX);
                    float fyMod = seedF(u_waveFreqY);

                    float phaseX = fract(sin(u_seed * 7.19) * 437.58) * 6.2832;
                    float phaseY = fract(cos(u_seed * 3.41) * 291.37) * 6.2832;

                    float harmonic = sin(u_seed * 1.23) * 0.5;
                    float a = fyMod * ruv.y - sin(ruv.x * fxMod + ruv.y - t + phaseX);
                    a += harmonic * sin(ruv.x * fxMod * 2.0 + ruv.y * 0.5 + t * 0.7 + phaseY);

                    a = smoothstep(
                        cos(a) * u_maskSoftness,
                        sin(a) * u_maskSoftness + 3.,
                        cos(a - fyMod * ruv.y) - sin(a - fxMod * ruv.x)
                    );

                    a *= u_waveAmplitude;

                    uv = cos(a) * uv + sin(a) * vec2(-uv.y, uv.x);
                    return uv;
                }

                void main() {
                    vec2 fragCoord = v_uv * u_resolution;
                    vec2 uv = fragCoord / u_resolution.xy;
                    float ratio = u_resolution.x / u_resolution.y;
                    float t = u_time * u_waveSpeed;

                    vec2 tuv = uv - 0.5;

                    vec2 seedShift = vec2(sin(u_seed * 4.37), cos(u_seed * 5.91)) * 100.0;
                    float degree = noise(vec2(t * 0.1, tuv.x * tuv.y) + seedShift);
                    tuv.y *= 1.0 / ratio;
                    tuv *= Rot(radians((degree - 0.5) * 720.0 + 180.0));
                    tuv.y *= ratio;

                    vec2 uv2 = (fragCoord * 2.0 - u_resolution.xy) / (u_resolution.x + u_resolution.y) * 2.0;
                    float preRotAngle = fract(sin(u_seed * 5.63) * 173.29) * 6.2832;
                    uv2 *= Rot(preRotAngle);
                    vec2 warped = warpUV(uv2) * 0.5 + 0.5;

                    vec2 blendUV = mix(tuv, warped - 0.5, u_blendAmount);

                    float layerRot1 = -5.0 + sin(u_seed * 1.83) * 20.0;
                    float layerRot2 = 10.0 + cos(u_seed * 2.47) * 20.0;

                    vec3 c0 = getColor(0);
                    vec3 c1 = getColor(1);
                    vec3 c2 = getColor(2);
                    vec3 c3 = getColor(3);

                    vec3 layer1 = mix(c0, c2, S(-0.3, 0.3, (blendUV * Rot(radians(layerRot1))).x));
                    vec3 layer2 = mix(c3, c1, S(-0.3, 0.3, (blendUV * Rot(radians(layerRot2))).x));
                    vec3 col = mix(layer1, layer2, S(0.3, -0.3, blendUV.y));

                    col = mix(col, col * col + 0.5 * sqrt(col), 0.3);

                    // Apply custom brightness multiplier
                    col *= u_brightness;

                    fragColor = vec4(col, 1.0);
                }`
            : `precision highp float;
                varying vec2 v_uv;

                uniform vec2 u_resolution;
                uniform float u_time;
                uniform vec4 u_colors[4];
                uniform int u_colors_length;
                uniform float u_seed;
                uniform float u_waveSpeed;
                uniform float u_waveFreqX;
                uniform float u_waveFreqY;
                uniform float u_waveAngle;
                uniform float u_waveAmplitude;
                uniform float u_maskSoftness;
                uniform float u_blendAmount;
                uniform float u_brightness;

                #define S(a,b,t) smoothstep(a,b,t)

                mat2 Rot(float a) {
                    float s = sin(a), c = cos(a);
                    return mat2(c, -s, s, c);
                }

                vec2 hash(vec2 p) {
                    float s = u_seed;
                    vec2 k1 = vec2(2127.1 + s * 13.37, 81.17 + s * 7.31);
                    vec2 k2 = vec2(1269.5 + s * 11.13, 283.37 + s * 5.79);
                    p = vec2(dot(p, k1), dot(p, k2));
                    return fract(sin(p) * (43758.5453 + s * 1.618));
                }

                float noise(in vec2 p) {
                    vec2 i = floor(p);
                    vec2 f = fract(p);
                    vec2 u = f * f * (3.0 - 2.0 * f);
                    float n = mix(
                        mix(dot(-1.0 + 2.0 * hash(i), f),
                            dot(-1.0 + 2.0 * hash(i + vec2(1.0, 0.0)), f - vec2(1.0, 0.0)), u.x),
                        mix(dot(-1.0 + 2.0 * hash(i + vec2(0.0, 1.0)), f - vec2(0.0, 1.0)),
                            dot(-1.0 + 2.0 * hash(i + vec2(1.0, 1.0)), f - vec2(1.0, 1.0)), u.x),
                        u.y
                    );
                    return 0.5 + 0.5 * n;
                }

                vec3 getColor(int idx) {
                    if (u_colors_length < 1) return vec3(0.0);
                    int safeIdx = clamp(idx, 0, u_colors_length - 1);
                    return u_colors[safeIdx].rgb;
                }

                float seedF(float base) {
                    return base * (1.0 + 0.5 * sin(u_seed * 3.17 + base));
                }

                vec2 warpUV(vec2 uv) {
                    float t = u_time * u_waveSpeed;

                    float angleOffset = sin(u_seed * 2.73) * 30.0;
                    mat2 dirRot = Rot(radians(u_waveAngle + angleOffset));
                    vec2 ruv = dirRot * uv;

                    float fxMod = seedF(u_waveFreqX);
                    float fyMod = seedF(u_waveFreqY);

                    float phaseX = fract(sin(u_seed * 7.19) * 437.58) * 6.2832;
                    float phaseY = fract(cos(u_seed * 3.41) * 291.37) * 6.2832;

                    float harmonic = sin(u_seed * 1.23) * 0.5;
                    float a = fyMod * ruv.y - sin(ruv.x * fxMod + ruv.y - t + phaseX);
                    a += harmonic * sin(ruv.x * fxMod * 2.0 + ruv.y * 0.5 + t * 0.7 + phaseY);

                    a = smoothstep(
                        cos(a) * u_maskSoftness,
                        sin(a) * u_maskSoftness + 3.,
                        cos(a - fyMod * ruv.y) - sin(a - fxMod * ruv.x)
                    );

                    a *= u_waveAmplitude;

                    uv = cos(a) * uv + sin(a) * vec2(-uv.y, uv.x);
                    return uv;
                }

                void main() {
                    vec2 fragCoord = v_uv * u_resolution;
                    vec2 uv = fragCoord / u_resolution.xy;
                    float ratio = u_resolution.x / u_resolution.y;
                    float t = u_time * u_waveSpeed;

                    vec2 tuv = uv - 0.5;

                    vec2 seedShift = vec2(sin(u_seed * 4.37), cos(u_seed * 5.91)) * 100.0;
                    float degree = noise(vec2(t * 0.1, tuv.x * tuv.y) + seedShift);
                    tuv.y *= 1.0 / ratio;
                    tuv *= Rot(radians((degree - 0.5) * 720.0 + 180.0));
                    tuv.y *= ratio;

                    vec2 uv2 = (fragCoord * 2.0 - u_resolution.xy) / (u_resolution.x + u_resolution.y) * 2.0;
                    float preRotAngle = fract(sin(u_seed * 5.63) * 173.29) * 6.2832;
                    uv2 *= Rot(preRotAngle);
                    vec2 warped = warpUV(uv2) * 0.5 + 0.5;

                    vec2 blendUV = mix(tuv, warped - 0.5, u_blendAmount);

                    float layerRot1 = -5.0 + sin(u_seed * 1.83) * 20.0;
                    float layerRot2 = 10.0 + cos(u_seed * 2.47) * 20.0;

                    vec3 c0 = getColor(0);
                    vec3 c1 = getColor(1);
                    vec3 c2 = getColor(2);
                    vec3 c3 = getColor(3);

                    vec3 layer1 = mix(c0, c2, S(-0.3, 0.3, (blendUV * Rot(radians(layerRot1))).x));
                    vec3 layer2 = mix(c3, c1, S(-0.3, 0.3, (blendUV * Rot(radians(layerRot2))).x));
                    vec3 col = mix(layer1, layer2, S(0.3, -0.3, blendUV.y));

                    col = mix(col, col * col + 0.5 * sqrt(col), 0.3);

                    // Apply custom brightness multiplier
                    col *= u_brightness;

                    gl_FragColor = vec4(col, 1.0);
                }`;

        const createShader = (type, source) => {
            const shader = gl.createShader(type);
            gl.shaderSource(shader, source);
            gl.compileShader(shader);
            if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
                console.error("Shader compile error:", gl.getShaderInfoLog(shader));
                gl.deleteShader(shader);
                return null;
            }
            return shader;
        };

        const vertexShader = createShader(gl.VERTEX_SHADER, vsSource);
        const fragmentShader = createShader(gl.FRAGMENT_SHADER, fsSource);
        if (!vertexShader || !fragmentShader) return;

        const program = gl.createProgram();
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);

        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            console.error("Program link error:", gl.getProgramInfoLog(program));
            return;
        }

        gl.useProgram(program);

        const positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.bufferData(
            gl.ARRAY_BUFFER,
            new Float32Array([
                -1.0, -1.0,
                 1.0, -1.0,
                -1.0,  1.0,
                -1.0,  1.0,
                 1.0, -1.0,
                 1.0,  1.0,
            ]),
            gl.STATIC_DRAW
        );

        const aPositionLocation = gl.getAttribLocation(program, "a_position");
        gl.enableVertexAttribArray(aPositionLocation);
        gl.vertexAttribPointer(aPositionLocation, 2, gl.FLOAT, false, 0, 0);

        // Uniform locations
        const uResolutionLocation = gl.getUniformLocation(program, "u_resolution");
        const uTimeLocation = gl.getUniformLocation(program, "u_time");
        const uColorsLocation = gl.getUniformLocation(program, "u_colors");
        const uColorsLengthLocation = gl.getUniformLocation(program, "u_colors_length");
        const uSeedLocation = gl.getUniformLocation(program, "u_seed");
        const uWaveSpeedLocation = gl.getUniformLocation(program, "u_waveSpeed");
        const uWaveFreqXLocation = gl.getUniformLocation(program, "u_waveFreqX");
        const uWaveFreqYLocation = gl.getUniformLocation(program, "u_waveFreqY");
        const uWaveAngleLocation = gl.getUniformLocation(program, "u_waveAngle");
        const uWaveAmplitudeLocation = gl.getUniformLocation(program, "u_waveAmplitude");
        const uMaskSoftnessLocation = gl.getUniformLocation(program, "u_maskSoftness");
        const uBlendAmountLocation = gl.getUniformLocation(program, "u_blendAmount");
        const uBrightnessLocation = gl.getUniformLocation(program, "u_brightness");

        // Flatten colors array to Float32Array
        const flatColors = new Float32Array(config.colors.flat());
        gl.uniform4fv(uColorsLocation, flatColors);
        gl.uniform1i(uColorsLengthLocation, config.colors.length);
        gl.uniform1f(uSeedLocation, config.seed);
        gl.uniform1f(uWaveSpeedLocation, config.waveSpeed);
        gl.uniform1f(uWaveFreqXLocation, config.waveFreqX);
        gl.uniform1f(uWaveFreqYLocation, config.waveFreqY);
        gl.uniform1f(uWaveAngleLocation, config.waveAngle);
        gl.uniform1f(uWaveAmplitudeLocation, config.waveAmplitude);
        gl.uniform1f(uMaskSoftnessLocation, config.maskSoftness);
        gl.uniform1f(uBlendAmountLocation, config.blendAmount);
        gl.uniform1f(uBrightnessLocation, config.brightness !== undefined ? config.brightness : 1.0);

        let animationFrameId;
        const startTime = performance.now();

        // Optimized resize handler
        const resize = () => {
            const scale = config.resolutionScale || 1.0;
            const width = Math.floor(window.innerWidth * scale);
            const height = Math.floor(window.innerHeight * scale);

            if (canvas.width !== width || canvas.height !== height) {
                canvas.width = width;
                canvas.height = height;
                gl.viewport(0, 0, width, height);
            }
        };

        const render = (now) => {
            if (document.hidden) {
                animationFrameId = requestAnimationFrame(render);
                return;
            }

            resize();
            const elapsed = (now - startTime) * 0.001;

            gl.uniform2f(uResolutionLocation, canvas.width, canvas.height);
            gl.uniform1f(uTimeLocation, elapsed);

            gl.drawArrays(gl.TRIANGLES, 0, 6);
            animationFrameId = requestAnimationFrame(render);
        };

        window.addEventListener("resize", resize);
        resize();
        animationFrameId = requestAnimationFrame(render);

        return () => {
            cancelAnimationFrame(animationFrameId);
            window.removeEventListener("resize", resize);
            if (program) gl.deleteProgram(program);
            if (vertexShader) gl.deleteShader(vertexShader);
            if (fragmentShader) gl.deleteShader(fragmentShader);
            if (positionBuffer) gl.deleteBuffer(positionBuffer);
        };
    }, [config]);

    return (
        <canvas
            ref={canvasRef}
            aria-hidden="true"
            className="fixed inset-0 w-full h-full pointer-events-none z-0 select-none block"
            style={{ width: "100vw", height: "100vh" }}
        />
    );
};

export default WaveBackground;
