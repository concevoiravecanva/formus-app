import type { Configuration } from "webpack";
import { DefinePlugin, optimize } from "webpack";
import * as path from "path";
import * as TerserPlugin from "terser-webpack-plugin";
import { transform } from "@formatjs/ts-transformer";
import * as chalk from "chalk";
import { config } from "dotenv";
import { Configuration as DevServerConfiguration } from "webpack-dev-server";
const HtmlWebpackPlugin = require('html-webpack-plugin');

config();

type DevConfig = {
  port: number;
  enableHmr: boolean;
  enableHttps: boolean;
  appOrigin?: string;
  appId?: string; // Deprecated in favour of appOrigin
  certFile?: string;
  keyFile?: string;
};

export function buildConfig({
  devConfig,
  appEntry = path.join(process.cwd(), "src", "index.tsx"),
  backendHost = process.env.CANVA_BACKEND_HOST,
}: {
  devConfig?: DevConfig;
  appEntry?: string;
  backendHost?: string;
} = {}): Configuration & DevServerConfiguration {
  const mode = devConfig ? "development" : "production";

  // --- Backend Host Check (No changes needed here) ---
  if (!backendHost) {
    console.error( /* ... */ );
    process.exit(-1);
  } else if (backendHost.includes("localhost") && mode === "production") {
    console.warn( /* ... */ );
  }
  // --- End Backend Host Check ---

  // === MAIN CONFIGURATION OBJECT ===
  return {
    mode,
    // AJOUTÉ : Définir devtool pour la production et le développement
    devtool: mode === 'production' ? 'source-map' : 'eval-source-map',
    context: path.resolve(process.cwd(), "./"),
    entry: {
      app: appEntry,
    },
    target: "web",
    resolve: { // (No changes needed here)
      alias: { /* ... */ },
      extensions: [ /* ... */ ],
    },
    infrastructureLogging: { // (No changes needed here)
      level: "none",
    },
    module: { // (No changes needed here)
      rules: [ /* ... */ ],
    },
    optimization: { // (No changes needed here)
      minimizer: [ /* ... */ ],
    },
    output: { // (No changes needed here)
      filename: `[name].js`,
      path: path.resolve(process.cwd(), "dist"),
      clean: true,
    },
    plugins: [ // (No changes needed here)
      new DefinePlugin({ /* ... */ }),
      new optimize.LimitChunkCountPlugin({ maxChunks: 1 }),
      new HtmlWebpackPlugin({ /* ... */ }),
    ].filter(Boolean),
    // On garde l'application de la config spécifique au devServer
    ...buildDevConfig(devConfig),
  };
  // === END MAIN CONFIGURATION OBJECT ===
}


// Fonction pour la configuration spécifique au serveur de développement
function buildDevConfig(options?: DevConfig): {
  // MODIFIÉ : Le devtool est maintenant géré au niveau principal
  // devtool?: string; // Supprimé d'ici
  devServer?: DevServerConfiguration;
} {
  if (!options) {
    // En mode production, on ne retourne que la partie devServer (qui sera vide ici)
    return {};
  }

  // --- Configuration du devServer (pas de changements majeurs ici) ---
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

  if (enableHmr && appOrigin) {
    devServer = { /* ... HMR config ... */ };
  } else if (enableHmr && appId) {
    console.warn( /* ... Deprecated HMR ... */ );
    devServer = { /* ... HMR config (deprecated) ... */ };
  } else {
    if (enableHmr && !appOrigin) { console.warn( /* ... HMR warning ... */ ); }
  }
  // --- Fin Configuration du devServer ---


  // Retourne uniquement la configuration du devServer
  return {
    // MODIFIÉ : Supprimé d'ici
    // devtool: "source-map",
    devServer,
  };
}


export default buildConfig;