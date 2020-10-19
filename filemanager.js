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
            upload_action: "a[data-upload-action]",
            tabs: {
                images: {
                    tab: "li[data-tab-for='images']",
                    container: "div[data-contain='images']",
                },
                videos: {
                    tab: "li[data-tab-for='videos']",
                    container: "div[data-contain='videos']",
                },
            },
            done_action: "button[data-done-btn]",
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
                class: "video-item",
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
     * @return void
     */
    init(display,
        data,
        callbacks = {
            on_complete: () => {}
        }) {
        /**
         * === Options expected under "display" param. ===
         * display = {
         *      tabs: {
         *          images: true/false,
         *          videos: true/false,
         *      },
         *      actions: {
         *          upload: true/false,
         *      },
         *      active_tab_by_default: 'images',
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

        // not specified what to display
        if (Object.keys(display).length === 0) {
            console.warn("FileManager: Not specified what all to display,",
                "so going by default and displaying all tabs",
                "and actions."
            );

            // custom options not set so set to default.
            display = {
                tabs: {
                    images: true,
                    videos: true,
                },
                actions: {
                    upload: true,
                },
                active_tab_by_default: "images",
            };
        }
        
        // value of "name" attr of file element which is invoked 
        // when user clicks on upload button.
        const filenode_name = "FM_file";
        
        // pointer to base Filemanager
        const _this = this;

        // upload button
        let _upload_action = display.actions.upload;
        
        // file which needs to be uploaded
        let to_upload_file = null;

        // existing file value which is selected i.e., image or video
        let selected_content = null;

        // if existing file is selected its source (URL) is stored
        let selected_content_src = null;

        // headers which will be sent as param during invoking callback
        let response = {
            upload_file: null, // to indicate whether user has selected custom file or not
            uploadable_file: File, // user custom selected file which needs to uploaded
            selected_file: null, // user selected file from existing files
            selected_content_src: null, // user selected file source (URL)
        };

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
                $file_ele.on("change", $file_ele, function () {
                    to_upload_file = $file_ele[0].files[0];
                    
                    // click "Done" button dynamically if user selects a custom file to upload, 
                    // so that it saves them certain time from manually clicking done btn 
                    // everytime they select a file.
                    $(_this.selectors.done_action).click();
                });
                $(this.$fm_wrap).append($file_ele);

                // open file selector
                $("input[name=" + filenode_name + "]").click();
            });
        }

        // display images tab
        if (display.tabs.images === true) {

            // pointer to images tab elements
            let _ = this.selectors.tabs.images;

            /**
             * Images tab was indicated as to display but no data was passed
             * so add a default message.
             */
            if (!data.images) {
                $(_.container).html(this.no_content_msg(
                        "No content here.",
                        "You have not added any images yet, try adding one."
                    )
                );
            }
            /** 
             * Images data provided.
             */ 
            else {
                $(_.container).html("");
                $.each(data.images, function (index, data) {
                    $(_.container).append(
                        _this.image_item(
                            data.src || "",
                            data.value || ""
                        )
                    );
                });
            }
            $(_.tab).show();
            $(_.container).show();
        }
        // do not display images tab and its container.
        else {
            $(this.selectors.tabs.images.tab).hide();
            $(this.selectors.tabs.images.container).hide();
        }

        // display videos tab
        if (display.tabs.videos === true) {

            // pointer to videos tab elements
            let _ = this.selectors.tabs.videos;

            /**
             * Videos tab was indicated as to display but no data was passed
             * so add a default message.
             */
            if (!data.videos) {
                $(_.container).html(this.no_content_msg(
                        "No content here.",
                        "You have not added any videos yet, try adding one."
                    )
                );
            }
            /** 
             * Videos data provided.
             */ 
            else {
                $(_.container).html("");
                $.each(data.videos, function (index, data) {
                    $(_.container).append(
                        _this.video_item(
                            data.src || "",
                            data.value || ""
                        )
                    );
                });
            }
            $(_.tab).show();
            $(_.container).show();
        }
        // do not display images tab and its container.
        else {
            $(this.selectors.tabs.videos.tab).hide();
            $(this.selectors.tabs.videos.container).hide();
        }

        // determine which tab to display intially and activate it
        if (
            typeof display.active_tab_by_default === "string" 
            && ( display.tabs.videos || display.tabs.images )
        ) {

            // convert to lowercase
            let tab_to_activate = display.active_tab_by_default.toLowerCase();

            // identify and activate appropriate tab
            switch (tab_to_activate) {
                case "images":
                    $(this.selectors.tabs.images.tab).click();
                    break;
                
                case "videos":
                    $(this.selectors.tabs.videos.tab).click();
                    break;

                default:
                    console.warn("FileManager: Tab to activate by default not",
                        "mentioned so trying to activate images tab.");
                    $(this.selectors.tabs.images.tab).click();
                    break;
            }
        }

        // add event listener to existing items only if existing
        // images or videos data is passed
        if (data.images || data.videos) {
            // when image/video item is selected
            this.$fm_wrap.on("click", ".thumbnail", (ele) => {
                let $this = $(ele.currentTarget);
                selected_content = $this.find("input[name='selected-content']").val() || null;

                // selected element is image
                if ($this.find("img").length) {
                    selected_content_src = $this.find("img").attr("src");
                } 
                // selected element is video
                else if ($this.find("video").length) {
                    selected_content_src = $this.find("video").attr("src");
                }

                $(".thumbnail").removeClass("selected");
                $this.addClass("selected");
            });
        }

        // when done button is clicked
        this.$fm_wrap.on("click", this.selectors.done_action, () => {
            
            // user has selected a file to upload
            if (to_upload_file) {
                response.upload_file = true;
                response.uploadable_file = to_upload_file;
            }
            // user has selected existing file
            else if (selected_content) {
                response.upload_file = false;
                response.uploadable_file = File;
                response.selected_file = selected_content;
                response.selected_content_src = selected_content_src;
            }
            $("#filemanager").modal("hide");
            callbacks.on_complete(response);
        });

        // when FM modal is about to be closed
        $("#filemanager").on("hide.bs.modal", function() {
            $(_this.$fm_wrap).off("click");
            $(_this.$fm_wrap).off("hide.bs.modal");
            $(_this.selectors.tabs.videos.container).html("");
            $(_this.selectors.tabs.images.container).html("");
        });

        $("#filemanager").modal("show");
    }
}



// export globally
window.Filemanager = Filemanager;