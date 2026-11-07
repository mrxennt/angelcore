(function () {
    class TTFLoader extends THREE.Loader {
        constructor(manager) {
            super(manager);
            this.reversed = false;
        }

        load(url, onLoad, onProgress, onError) {
            const scope = this;
            const loader = new THREE.FileLoader(this.manager);

            loader.setPath(this.path);
            loader.setResponseType("arraybuffer");
            loader.setRequestHeader(this.requestHeader);
            loader.setWithCredentials(this.withCredentials);
            loader.load(url, function (buffer) {
                try {
                    onLoad(scope.parse(buffer));
                } catch (error) {
                    if (onError) onError(error);
                    else console.error(error);
                    scope.manager.itemError(url);
                }
            }, onProgress, onError);
        }

        parse(arrayBuffer) {
            function reverseCommands(commands) {
                const commandGroups = [];
                let currentGroup;

                commands.forEach(function (command) {
                    if (command.type.toLowerCase() === "m") {
                        currentGroup = [command];
                        commandGroups.push(currentGroup);
                    } else if (command.type.toLowerCase() !== "z") {
                        currentGroup.push(command);
                    }
                });

                const reversedCommands = [];
                commandGroups.forEach(function (group) {
                    reversedCommands.push({
                        type: "m",
                        x: group[group.length - 1].x,
                        y: group[group.length - 1].y,
                    });

                    for (let index = group.length - 1; index > 0; index--) {
                        const sourceCommand = group[index];
                        const reversedCommand = { type: sourceCommand.type };

                        if (sourceCommand.x2 !== undefined && sourceCommand.y2 !== undefined) {
                            reversedCommand.x1 = sourceCommand.x2;
                            reversedCommand.y1 = sourceCommand.y2;
                            reversedCommand.x2 = sourceCommand.x1;
                            reversedCommand.y2 = sourceCommand.y1;
                        } else if (sourceCommand.x1 !== undefined && sourceCommand.y1 !== undefined) {
                            reversedCommand.x1 = sourceCommand.x1;
                            reversedCommand.y1 = sourceCommand.y1;
                        }

                        reversedCommand.x = group[index - 1].x;
                        reversedCommand.y = group[index - 1].y;
                        reversedCommands.push(reversedCommand);
                    }
                });

                return reversedCommands;
            }

            function convertFont(font, shouldReverse) {
                const round = Math.round;
                const glyphs = {};
                const scale = 100000 / (72 * (font.unitsPerEm || 2048));
                const glyphIndexMap = font.encoding.cmap.glyphIndexMap;
                const characterCodes = Object.keys(glyphIndexMap);

                for (let index = 0; index < characterCodes.length; index++) {
                    const characterCode = characterCodes[index];
                    const glyph = font.glyphs.glyphs[glyphIndexMap[characterCode]];
                    if (characterCode === undefined) continue;

                    const convertedGlyph = {
                        ha: round(glyph.advanceWidth * scale),
                        x_min: round(glyph.xMin * scale),
                        x_max: round(glyph.xMax * scale),
                        o: "",
                    };

                    if (shouldReverse) glyph.path.commands = reverseCommands(glyph.path.commands);

                    glyph.path.commands.forEach(function (command) {
                        if (command.type.toLowerCase() === "c") command.type = "b";
                        convertedGlyph.o += command.type.toLowerCase() + " ";
                        if (command.x !== undefined && command.y !== undefined) {
                            convertedGlyph.o += round(command.x * scale) + " " + round(command.y * scale) + " ";
                        }
                        if (command.x1 !== undefined && command.y1 !== undefined) {
                            convertedGlyph.o += round(command.x1 * scale) + " " + round(command.y1 * scale) + " ";
                        }
                        if (command.x2 !== undefined && command.y2 !== undefined) {
                            convertedGlyph.o += round(command.x2 * scale) + " " + round(command.y2 * scale) + " ";
                        }
                    });

                    glyphs[String.fromCodePoint(glyph.unicode)] = convertedGlyph;
                }

                return {
                    glyphs: glyphs,
                    familyName: font.getEnglishName("fullName"),
                    ascender: round(font.ascender * scale),
                    descender: round(font.descender * scale),
                    underlinePosition: font.tables.post.underlinePosition,
                    underlineThickness: font.tables.post.underlineThickness,
                    boundingBox: {
                        xMin: font.tables.head.xMin,
                        xMax: font.tables.head.xMax,
                        yMin: font.tables.head.yMin,
                        yMax: font.tables.head.yMax,
                    },
                    resolution: 1000,
                    original_font_information: font.tables.name,
                };
            }

            if (typeof opentype === "undefined") {
                console.warn("THREE.TTFLoader: The loader requires opentype.js. Make sure it's included before using the loader.");
                return null;
            }

            return convertFont(opentype.parse(arrayBuffer), this.reversed);
        }
    }

    THREE.TTFLoader = TTFLoader;
})();
