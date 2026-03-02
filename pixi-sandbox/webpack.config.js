const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const { webpack } = require("webpack");
const { DefinePlugin } = require("webpack");

module.exports = {
    entry: "./src/index.ts",
    output: {
        filename: "bundle.js",
        path: path.resolve(__dirname, "dist"),
        clean: true,
    },
    resolve: {
        extensions: [".ts", ".js"],
        alias: {
            "pixi-particles-engine": path.resolve(__dirname, "../pixi-particles-engine/src/index.ts"),
        },
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                include: [path.resolve(__dirname, "src"), path.resolve(__dirname, "../pixi-particles-engine/src")],
                use: "ts-loader",
            },
        ],
    },
    mode: process.env.MODE || "development",
    plugins: [
        new HtmlWebpackPlugin({
            template: "src/index.html",
            inject: "body",
        }),
        new DefinePlugin({
            "process.env.MODE": JSON.stringify(process.env.MODE || "development"),
        }),
        new CopyWebpackPlugin({
            patterns: [
                {
                    from: path.resolve(__dirname, "assets"), // source folder
                    to: "assets", // destination inside dist/
                },
            ],
        }),
    ],
    devServer: {
        static: {
            directory: path.join(__dirname, "dist"),
        },
        port: 3000,
        open: true,
        hot: true,
        watchFiles: ["assets/**/*"], // optional, ensures full watch coverage
    },
    mode: "development",
    devtool: "source-map",
};
