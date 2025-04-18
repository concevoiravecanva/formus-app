// Utilise require pour TOUS les imports top-level
const { DefinePlugin, optimize } = require("webpack");
const path = require("path");
const TerserPlugin = require("terser-webpack-plugin");
const { transform } = require("@formatjs/ts-transformer");
const chalk = require("chalk");
const { config } = require("dotenv");
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

// Les annotations de type peuvent rester pour l'aide au développement
type Configuration = import('webpack').Configuration;
type DevServerConfiguration = import('webpack-dev-server').Configuration;

config(); // dotenv config

// Le type DevConfig reste inchangé
type DevConfig = {
  port: number;
  enableHmr: boolean;
  enableHttps: boolean;
  appOrigin?: string;
  appId?: string; // Deprecated in favour of appOrigin
  certFile?: string;
  keyFile?: string;
};

// MODIFIÉ : Retire 'export' de la déclaration de fonction
function buildConfig({
  devConfig,
  appEntry = path.join(process.cwd(), "src", "index.tsx"),
  backendHost = process.env.CANVA_BACKEND_HOST,
}: {
  devConfig?: DevConfig;
  appEntry?: string;
  backendHost?: string;
} = {}): Configuration & DevServerConfiguration {
  const mode = devConfig ? "development" : "production";
  const isProduction = mode === 'production';

  // --- Backend Host Check --- (inchangé)
  if (!backendHost) {
    console.error(
        chalk.redBright.bold("BACKEND_HOST is undefined."),
        `Refer to "Customizing the backend host" in the README.md for more information.`,
    );
    process.exit(-1);
  } else if (backendHost.includes("localhost") && isProduction) {
    console.warn(
        chalk.yellowBright.bold(
            "BACKEND_HOST should not be set to localhost for production builds!",
        ),
        `Refer to "Customizing the backend host" in the README.md for more information.`,
    );
  }
  // --- End Backend Host Check ---

  // === MAIN CONFIGURATION OBJECT ===
  return {
    mode,
    devtool: isProduction ? 'source-map' : 'eval-source-map',
    context: path.resolve(process.cwd(), "./"),
    entry: {
      app: appEntry,
    },
    target: "web",
    resolve: { // (inchangé)
      alias: {
        assets: path.resolve(process.cwd(), "assets"),
        utils: path.resolve(process.cwd(), "utils"),
        styles: path.resolve(process.cwd(), "styles"),
        src: path.resolve(process.cwd(), "src"),
      },
      extensions: [".ts", ".tsx", ".js", ".css", ".svg", ".woff", ".woff2"],
    },
    infrastructureLogging: { // (inchangé)
      level: "none",
    },
    module: { // (règles CSS modifiées précédemment pour MiniCssExtractPlugin sont conservées)
      rules: [
        { // Règle ts-loader (inchangée)
          test: /\.tsx?$/,
          exclude: /node_modules/,
          use: [
            {
              loader: "ts-loader",
              options: {
                transpileOnly: true,
                getCustomTransformers: () => ({
                    before: [
                        transform({
                            overrideIdFn: "[sha512:contenthash:base64:6]",
                        }),
                    ],
                }),
              },
            },
          ],
        },
        { // Règle CSS (Application)
          test: /\.css$/,
          exclude: /node_modules/,
          use: [
            isProduction ? MiniCssExtractPlugin.loader : 'style-loader',
            {
              loader: "css-loader",
              options: {
                modules: true,
              },
            },
            {
              loader: "postcss-loader",
              options: {
                postcssOptions: {
                  plugins: [require("cssnano")({ preset: "default" })],
                },
              },
            },
          ],
        },
        { // Règle images (inchangée)
          test: /\.(png|jpg|jpeg)$/i,
          type: "asset/inline",
        },
        { // Règle polices (inchangée)
          test: /\.(woff|woff2)$/,
          type: "asset/inline",
        },
        { // Règle SVG (inchangée)
          test: /\.svg$/,
          oneOf: [
            {
              issuer: /\.[jt]sx?$/,
              resourceQuery: /react/, // *.svg?react
              use: ["@svgr/webpack", "url-loader"],
            },
            {
              type: "asset/resource",
              parser: {
                dataUrlCondition: {
                  maxSize: 200,
                },
              },
            },
          ],
        },
        { // Règle CSS node_modules
          test: /\.css$/,
          include: /node_modules/,
          use: [
             isProduction ? MiniCssExtractPlugin.loader : 'style-loader',
            "css-loader",
            {
              loader: "postcss-loader",
              options: {
                postcssOptions: {
                  plugins: [require("cssnano")({ preset: "default" })],
                },
              },
            },
          ],
        },
      ],
    },
    optimization: { // (inchangée)
      minimizer: [
        new TerserPlugin({
          terserOptions: {
            format: {
              ascii_only: true,
            },
          },
        }),
      ],
    },
    output: { // (inchangé)
      filename: `[name].js`,
      path: path.resolve(process.cwd(), "dist"),
      clean: true,
    },
    plugins: [ // --- MODIFIÉ ICI ---
      new DefinePlugin({
        // Définit la variable d'environnement NODE_ENV pour le code client
        'process.env.NODE_ENV': JSON.stringify(mode), // <--- AJOUT DE CETTE LIGNE
        // Garde la définition de BACKEND_HOST
        BACKEND_HOST: JSON.stringify(backendHost),
      }),
      new optimize.LimitChunkCountPlugin({ maxChunks: 1 }),
      new HtmlWebpackPlugin({
        template: path.resolve(process.cwd(), 'index.html'),
        inject: 'body',
      }),
      // Ajoute le plugin SEULEMENT en production (inchangé)
      isProduction && new MiniCssExtractPlugin({
        filename: '[name].[contenthash].css',
        chunkFilename: '[id].[contenthash].css',
      }),
    ].filter(Boolean),
    // Applique la config spécifique au devServer (inchangée)
    ...buildDevConfig(devConfig),
  };
  // === END MAIN CONFIGURATION OBJECT ===
}


// Fonction pour la configuration spécifique au serveur de développement (inchangée)
function buildDevConfig(options?: DevConfig): {
  devServer?: DevServerConfiguration;
} {
  // ... (contenu de la fonction inchangé) ...
  if (!options) {
    return {};
  }

  const { port, enableHmr, appOrigin, appId, enableHttps, certFile, keyFile } =
    options;

  let devServer: DevServerConfiguration = {
    server: enableHttps ? { type: "https", options: { cert: certFile, key: keyFile } } : "http",
    host: "localhost",
    historyApiFallback: { rewrites: [{ from: /^\/$/, to: "/index.html" }] },
    port,
    client: { logging: "verbose" },
    static: { directory: path.resolve(process.cwd(), "assets"), publicPath: "/assets" },
  };

  // Logique HMR (inchangée)
  if (enableHmr && appOrigin) {
    devServer = {
        ...devServer,
        allowedHosts: new URL(appOrigin).hostname,
        headers: {
            "Access-Control-Allow-Origin": appOrigin,
            "Access-Control-Allow-Credentials": "true",
            "Access-Control-Allow-Private-Network": "true",
        },
     };
  } else if (enableHmr && appId) {
    console.warn(
        "Enabling Hot Module Replacement (HMR) with an App ID is deprecated, please see the README.md on how to update.",
    );
    const appDomain = `app-${appId.toLowerCase().trim()}.canva-apps.com`;
    devServer = {
        ...devServer,
        allowedHosts: appDomain,
        headers: {
            "Access-Control-Allow-Origin": `https://${appDomain}`,
            "Access-Control-Allow-Credentials": "true",
            "Access-Control-Allow-Private-Network": "true",
        },
    };
  } else {
    if (enableHmr && !appOrigin) {
        console.warn(
            "Attempted to enable Hot Module Replacement (HMR) without configuring App Origin... Disabling HMR.",
        );
    }
  }

  return {
    devServer,
  };
}

// MODIFIÉ : Utilise module.exports pour exporter la fonction principale
module.exports = buildConfig;