/*
 * fract-jquery.js
 *
 * version 1.0.2
 *
 * A small javascript library for replacting/updating fractions of a page dynamically from server-side responses.
 *
 * Licensed under The MIT License (MIT)
 * Copyright © 2021 YANO Tsutomu
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
 * documentation files (the “Software”), to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software,
 * and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of
 * the Software.
 *
 * THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO
 * THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
 * COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
 * TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
 * IN THE SOFTWARE.
 */
var Fract = (function($) {
    function findElementByComponentPath(componentPath) {
        var path = null;
        if(componentPath.indexOf(':') >= 0) {
            path = componentPath.split(':')
                                .filter(item => item != null)
                                .map(item => '*[data-fract-id="' + item + '"]')
                                .join(' ');

        } else {
            path = '*[data-fract-id="' + componentPath + '"]';
        }
        return $(path);
    }

    function createFractionElements(fractions) {
        if(fractions == null) {
            return [];
        }

        if(!Array.isArray(fractions)) {
            fractions = [fractions];
        }

        return fractions.map(fraction => $(fraction)).reduce($.merge);
    }

    function replace(path, $targetElement, $newElements) {
        if($targetElement && $newElements) {
            if($newElements.length > 1) {
                console.error('More than one fraction element are returned from server for path: %s', path);
                return;
            }

            $targetElement.replaceWith($newElements);
        }
    }

    function prepend(path, $targetElement, $newElements) {
        if($targetElement && $newElements) {
            var $current = $targetElement.first();
            $newElements.each(function(index, elem) {
                $current.before(elem);
                $current = $(elem).first();
            });
        }
    }

    function append(path, $targetElement, $newElements) {
        if($targetElement && $newElements) {
            var $current = $targetElement.first();
            $newElements.each(function(index, elem) {
                $current.after(elem);
                $current = $(elem).first();
            });
        }
    }

    function wrapByFunction(scriptStr) {
        return '(function() {' + scriptStr + '})();';
    }

    function handleFractResponse(response) {
        var redirect = response.redirect;
        var components = response.components;
        var preAction = response.preAction;
        var postAction = response.postAction;

        if(redirect) {
            window.location = redirect;
            return;
        } else {
            var preActionResult = null;
            if(preAction) {
                preActionResult = eval(wrapByFunction(preAction));
            }
            if(preActionResult === false) {
                return;
            }
            if(components) {
                Object.keys(components).forEach(p => {
                    var componentPath = p.trim();
                    var $targetElement = findElementByComponentPath(componentPath);
                    if($targetElement.length > 0) {
                        var updateInfo = components[componentPath];
                        if(updateInfo) {
                            var fractions = [];
                            if(Array.isArray(updateInfo) || (typeof (updateInfo) === "string" || updateInfo instanceof String)) {
                                fractions = updateInfo;
                            } else {
                                fractions = updateInfo.fractions;
                            }
                            var componentPreAction = updateInfo.preAction;
                            var componentPostAction = updateInfo.postAction;

                            var componentPreActionResult = null;
                            if(componentPreAction) {
                                componentPreActionResult = eval(wrapByFunction(componentPreAction));
                            }
                            if(componentPreActionResult !== false) {
                                if(fractions) {
                                    var $newElements = createFractionElements(fractions);
                                    if($newElements.length > 0) {
                                        var method = updateInfo.method || 'replace';
                                        switch(method) {
                                            case 'prepend':
                                                prepend(componentPath, $targetElement, $newElements);
                                                break;
                                            case 'replace':
                                                replace(componentPath, $targetElement, $newElements);
                                                break;
                                            case 'append':
                                                append(componentPath, $targetElement, $newElements);
                                                break;
                                        }
                                    }
                                } else {
                                    console.warn('No fractions are found in the component map in a current response.');
                                }

                                if(componentPostAction) {
                                    eval(wrapByFunction(componentPostAction));
                                }
                            }
                        }
                    }
                });
            }
            if(postAction) {
                eval(wrapByFunction(postAction));
            }
        }
    }

    function send(url, settings) {
        if(settings == null) {
            settings = {};
        }
        if(settings.dataType == null) {
            settings.dataType = "json";
        }
        return $.ajax(url, settings).done(function(data) {
            try {
                handleFractResponse(data);
            } catch(e) {
                console.error(e);
            }
        });
    }

    function sendForm(formElement, submitter, settings) {
        if(formElement) {
            var formData = new FormData(formElement);

            if(submitter && submitter.tagName.toLowerCase() == 'input') {
                $source = $(submitter);
                const name = $source.attr("name");
                const value = $source.val();
                formData.append(name, value);
            }

            var $form = $(formElement);
            var url = $form.attr('action');
            var method = $form.attr('method');

            if(settings == null) {
                settings = {}
            }
            if(settings.type == null) {
                settings.type = method;
            }
            if(settings.method == null) {
                settings.method = method;
            }
            if(settings.data == null) {
                settings.data = formData;
            }
            settings.processData = false;
            settings.contentType = false;
            return send(url, settings);
        }
    }

    return {
        handleFractResponse: handleFractResponse,
        send: send,
        sendForm: sendForm
    };
})(jQuery);