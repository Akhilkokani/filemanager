/**
 * Filemanager - A simple go-to filemanager.
 * 
 * Source: https://github.com/Akhilkokani/filemanager
 * @author Akhil Kokani
 */





/**
 * Filemanager (FM)
 * 
 * @param {object} element JQuery DOM Node of FM wrapper
 * @return {void}
 */
class Filemanager {





    constructor(element) {

        this.$fm_wrap = $(element);

        // element selectors which are required at various stages
        this.selectors = {
            "upload_action": "a[data-upload-action]",
            "tabs": {
                "images": {
                    "tab": "li[data-tab-for='images']",
                    "container": "div[data-contain='images']",
                },
                "videos": {
                    "tab": "li[data-tab-for='videos']",
                    "container": "div[data-contain='videos']",
                },
            },
        };

        // radio input node
        var _radio_input = (value="") => {
            let $ip_radio = $("<input>", {
                type: "radio",
                name: "selected-content",
                value: value,
            });
            return $ip_radio;
        };

        // creates new video item
        this.video_item = (src="", value="") => {

            let $ip_radio = _radio_input(value);

            let $video = $("<video>", {
                src: src,
                controls: "",
            });

            let $div_thumbnail = $("<div>", {
                class: "thumbnail",
            });
            $div_thumbnail.append(
                $video
            );
            $div_thumbnail.append(
                $ip_radio
            );

            let $div_item = $("<div>", {
                class: "item",
            });
            $div_item.append(
                $div_thumbnail
            );

            return $div_item;
        };

        // creates new image item
        this.image_item = (src="", value="") => {

            let $ip_radio = _radio_input(value);

            let $image = $("<img>", {
                src: src,
                class: "image-item",
            });

            let $div_thumbnail = $("<div>", {
                class: "thumbnail",
            });
            $div_thumbnail.append(
                $image
            );
            $div_thumbnail.append(
                $ip_radio
            );

            let $div_item = $("<div>", {
                class: "item",
            });
            $div_item.append(
                $div_thumbnail
            );

            return $div_item;
        };

        // creates no content with given message
        this.no_content_msg = function (
            title = "No content here.",
            msg = "It seems you have added anything. Try uploading files."
        ) {
            let $p_msg = $("<p>", {
                class: "text-muted",
            });
            $p_msg.append(msg);

            let $h3_title = $("<h3>");
            $h3_title.append(title);

            let $div_nocontent = $("<div>", {
                class: "no-content",
            });
            $div_nocontent.append($h3_title);
            $div_nocontent.append($p_msg);

            return $div_nocontent;
        };
    }





    /**
     * Initialises FM with given data and tabs to display.
     *
     * @param {JSON} display Describe which all tabs and
     *  whether upload action has to be displayed or not.
     * @param {JSON} data Data to display inside each tab.
     * @param {JSON} callbacks Functions to invoked
     *  dynamically.
     * @return {void}
     */
    init(display,
        data,
        callbacks = {
            "on_complete": () => {}
        }) {
        /**
         * === Options expected under "display" param. ===
         * display = {
         *      'tabs': {
         *          'images': true/false,
         *          'videos': true/false,
         *      },
         *      'actions': {
         *          'upload': true/false,
         *      },
         * };
         *
         * === Options expected under "data" param. ===
         * data = {
         *      'images': {
         *          0: {
         *              'src': ...,
         *              'value': ...,
         *          },
         *          ...
         *      },
         *      'videos': {
         *          0: {
         *              'src': ...,
         *              'value': ...,
         *          },
         *          ...
         *      }
         * };
         */
        // value of "name" attr of file element which is invoked 
        // when user clicks on upload button.
        let filenode_name = "FM_file";
        let _this = this; // pointer to base Filemanager

        if (!display) {
            console.warn("Not specified what all to display,",
                "so going by default and displaying all tabs",
                "and actions."
            );

            // custom options not set so set default ones.
            display = {
                'tabs': {
                    'images': true,
                    'videos': true,
                },
                'actions': {
                    'upload': true,
                },
            };
        }

        let _upload_action = display.actions.upload; // upload button
        let to_upload_file = null; // file which needs to be uploaded


        // prevent user from uploading files
        if (_upload_action === false) {
            $("input[name=" + filenode_name + "]").remove();
            $(this.selectors.upload_action).on("click", () => { });
            $(this.selectors.upload_action).hide();
        }

        // allow user to upload custom files
        if (_upload_action === true) {

            // when upload button is clicked
            this.$fm_wrap.on("click", this.selectors.upload_action, () => {

                // remove existing file node, if any
                $("input[name=" + filenode_name + "]").remove();

                // create new file node, attach events and append
                let $file_ele = $("<input>", {
                    type: "file",
                    name: filenode_name,
                    style: "position: absolute; top: -100px;",
                });
                this.$fm_wrap.on("change", $file_ele, function () {
                    to_upload_file = $file_ele[0].files[0];
                });
                $(this.$fm_wrap).append($file_ele);

                // open file selector
                $("input[name=" + filenode_name + "]").click();
            });
        }

        if (display.tabs.images === true) {
            /**
             * display images tab, overwrite if hidden previously
             * clean container, overwrite if contains anything previously
             * render all images into tab content,
             * if no images add no content block.
             * activate images tab.
             */
            let _ = this.selectors.tabs.images;

            if (!data.images) {
                $(_.container).html(this.no_content_msg(
                    "No content here.",
                    "You have not added any images yet, try uploading."
                )
                );
            } else {
                $(_.container).html("");
                $.each(data.images, function (index, img_data) {
                    $(_.container).append(
                        _this.image_item(
                            img_data.src || "",
                            img_data.value || ""
                        )
                    );
                });
            }
            $(_.tab).show();
            $(_.container).show();
        }
        else {
            $(_this.selectors.tabs.images.tab).hide();
            $(_this.selectors.tabs.images.container).hide();
        }

        // headers which will be returned
        let response = {
            "upload_file": null,
            "uploadable_file": null,
            "selected_file_value": null,
        };

        // user has selected a file to upload
        if (to_upload_file) {
            response.upload_file = true;
            response.uploadable_file = to_upload_file;
        }
        else {
            // for selected file from existing ones
        }
    }
}





// export globally
window.Filemanager = Filemanager;