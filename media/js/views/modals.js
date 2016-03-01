/*
 * MODAL VIEWS
 */

'use strict';

+function(window, $, _) {

    window.LCB = window.LCB || {};

    window.LCB.ModalView = Backbone.View.extend({
        events: {
        	'submit form': 'submit'
        },
        initialize: function(options) {
            this.render();
        },
        render: function() {
            this.$('form.validate').validate();
            this.$el.on('shown.bs.modal hidden.bs.modal',
                        _.bind(this.refresh, this));
        },
        refresh: function() {
            var that = this;
            this.$('[data-model]').each(function() {
                $(this).val && $(this).val(that.model.get($(this).data('model')));
            });
        },
        success: function() {
            swal('Updated!', '', 'success');
            this.$el.modal('hide');
        },
        error: function() {
            swal('Woops!', '', 'error');
        },
        submit: function(e) {
        	e && e.preventDefault();

            var $form = this.$('form[action]');
            var opts = {
                type: $form.attr('method') || 'POST',
                url: $form.attr('action'),
                data: $form.serialize(),
                dataType: 'json'
            };

            if (this.success) {
                opts.success = _.bind(this.success, this);
            }
            if (this.error) {
                opts.error = _.bind(this.error, this);
            }
            if (this.complete) {
                opts.complete = _.bind(this.complete, this);
            }

            $.ajax(opts);
        }
    });

    window.LCB.ProfileModalView = window.LCB.ModalView.extend({
        success: function() {
            swal('Profile Updated!', 'Your profile has been updated.',
                 'success');
            this.$el.modal('hide');
        },
        error: function() {
            swal('Woops!', 'Your profile was not updated.', 'error');
        }
    });

    window.LCB.AccountModalView = window.LCB.ModalView.extend({
        success: function() {
            swal('Account Updated!', 'Your account has been updated.', 'success');
            this.$el.modal('hide');
            this.$('[type="password"]').val('');
        },
        error: function(req) {
            var message = req.responseJSON && req.responseJSON.reason ||
                          'Your account was not updated.';

            swal('Woops!', message, 'error');
        },
        complete: function() {
            this.$('[name="current-password"]').val('');
        }
    });

    window.LCB.RoomPasswordModalView = Backbone.View.extend({
        events: {
            'click .btn-primary': 'enterRoom'
        },
        initialize: function(options) {
            this.render();
            this.$name = this.$('.lcb-room-password-name');
            this.$password = this.$('input.lcb-room-password-required');
        },
        render: function() {
            // this.$el.on('shown.bs.modal hidden.bs.modal',
            //             _.bind(this.refresh, this));
        },
        show: function(options) {
            this.callback = options.callback;
            this.$password.val('');
            this.$name.text(options.roomName || '');
            this.$el.modal('show');
        },
        enterRoom: function() {
            this.$el.modal('hide');
            this.callback(this.$password.val());
        }
    });

    window.LCB.AuthTokensModalView = Backbone.View.extend({
        events: {
            'click .generate-token': 'generateToken',
            'click .revoke-token': 'revokeToken'
        },
        initialize: function(options) {
            this.render();
        },
        render: function() {
            this.$el.on('shown.bs.modal hidden.bs.modal',
                        _.bind(this.refresh, this));
        },
        refresh: function() {
            this.$('.token').val('');
            this.$('.generated-token').hide();
        },
        getToken: function() {
            var that = this;
            $.post('./account/token/generate', function(data) {
                if (data.token) {
                    that.$('.token').val(data.token);
                    that.$('.generated-token').show();
                }
            });
        },
        removeToken: function() {
            var that = this;
            $.post('./account/token/revoke', function(data) {
                that.refresh();
                swal('Success', 'Authentication token revoked!', 'success');
            });
        },
        generateToken: function() {
            swal({
                title: 'Are you sure?',
                text: 'This will overwrite any existing authentication token you may have.',   type: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Yes',
                closeOnConfirm: true },
                _.bind(this.getToken, this)
            );
        },
        revokeToken: function() {
            swal({
                title: 'Are you sure?',
                text: 'This will revoke access from any process using your current authentication token.',   type: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Yes',
                closeOnConfirm: false },
                _.bind(this.removeToken, this)
            );
        }
    });

    window.LCB.NotificationsModalView = Backbone.View.extend({
        events: {
            'click [name=desktop-notifications]': 'toggleDesktopNotifications'
        },
        initialize: function() {
            this.render();
        },
        render: function() {
            var $input = this.$('[name=desktop-notifications]');
            $input.find('.disabled').show()
              .siblings().hide();
            if (!notify.isSupported) {
                $input.attr('disabled', true);
                // Welp we're done here
                return;
            }
            if (notify.permissionLevel() === notify.PERMISSION_GRANTED) {
                $input.find('.enabled').show()
                  .siblings().hide();
            }
            if (notify.permissionLevel() === notify.PERMISSION_DENIED) {
                $input.find('.blocked').show()
                  .siblings().hide();
            }
        },
        toggleDesktopNotifications: function() {
            var that = this;
            if (!notify.isSupported) {
                return;
            }
            notify.requestPermission(function() {
                that.render();
            });
        }
    });

    window.LCB.GiphyModalView = Backbone.View.extend({
        events: {
            'keypress .search-giphy': 'stopReturn',
            'keyup .search-giphy': 'loadGifs'
        },
        initialize: function(options) {
            this.render();
        },
        render: function() {
            this.$el.on('shown.bs.modal hidden.bs.modal',
                        _.bind(this.refresh, this));
        },
        refresh: function() {
            this.$el.find('.giphy-results ul').empty();
            this.$('.search-giphy').val('').focus();
        },
        stopReturn: function(e) {
            if(e.keyCode === 13) {
                return false;
            }
        },
        loadGifs: _.debounce(function() {
            var that = this;
            var search = this.$el.find('.search-giphy').val();

            $.get('https://api.giphy.com/v1/gifs/search', {
                q: search,
                rating: this.$el.data('rating'),
                limit: this.$el.data('limit'),
                api_key: this.$el.data('apikey')
            })
            .done(function(result) {
                var images = result.data.filter(function(entry) {
                    return entry.images.fixed_width.url;
                }).map(function(entry) {
                    return entry.images.fixed_width.url;
                });

                that.appendGifs(images);
            });
        }, 400),
        appendGifs: function(images) {
            var eles = images.map(function(url) {
                var that = this;
                var $img = $('<img src="' + url +
                       '" alt="gif" data-dismiss="modal"/></li>');

                $img.click(function() {
                    var src = $(this).attr('src');
                    $('.lcb-entry-input:visible').val(src);
                    $('.lcb-entry-button:visible').click();
                    that.$el.modal('hide');
                });

                return $("<li>").append($img);
            }, this);

            var $div = this.$el.find('.giphy-results ul');

            $div.empty();

            eles.forEach(function($ele) {
                $div.append($ele);
            });
        }
    });

    window.LCB.WriteAnswerModalView = Backbone.View.extend({
        events: {
            'click #lcb-submit-answer': 'submitAnswer',
            'click #record-audio-answer': 'clickMicrophone',
            'click #save-audio-answer': 'saveAudioAnswer'
        },
        initialize: function(options) {
            this.client = options.client;
            this.$editor = new Quill('#editor', {
                modules: {
                    'toolbar': { container: '#toolbar' },
                    'link-tooltip': true
                },
                theme: 'snow'
            });
            this.render();
            this.audioBlob = false;
            this.recording = false;
            var that = this;
            navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia;
            navigator.getUserMedia({
                        audio: true
                },
                function(stream) {
                    that.recordAudio = RecordRTC(stream, {
                        disableLogs: true,
                        type: 'audio',
                        bufferSize: 16384
                    });
                },
                function(error) {
                    swal(JSON.stringify(error), '', 'error');
                }
            );
            this.recorder = {};
            this.nowrecording = false;
        },
        render: function() {
            this.$el.on('show.bs.modal', _.bind(this.fillFields, this));
        },
        audioAnswer: function(e){
            if(this.nowrecording){
                this.pauseAudioAnswer();
                this.nowrecording = false;
            }
            else{
                this.recordAudioAnswer();
                this.nowrecording = true;
            }
        },
        fillFields: function(event) {
            var $button = $(event.relatedTarget),
                listElement = null;

            this.$editor.setHTML('');
            this.$questionAnswered = null;
            this.$messageId = null;

            if($button.data('edit') === true) {
                this.$messageId = $button.data('message');
                listElement = $('#'+$button.data('id'));
                this.$editor.setHTML(listElement.find('.lcb-answer-text').html());
            }

            else {
                this.$messageId = $button.data('id');
                listElement = $('#'+this.$messageId);
                this.$questionAnswered = $button.data('answered');
            }
            this.$roomId = $button.data('room');
            this.$el.find('.modal-title').text(listElement ? listElement.find('.lcb-message-text').text() : 'Write Answer');
        },
        get_signed_request: function(file, cb){
            var that = this;
            var xhr = new XMLHttpRequest();
            xhr.open("GET", "/sign_s3?file_name="+file.name+"&file_type="+file.type);
            xhr.overrideMimeType('text/plain; charset=x-user-defined');
            xhr.onreadystatechange = function(){
                if(xhr.readyState === 4){
                    if(xhr.status === 200){
                        var response = JSON.parse(xhr.responseText);
                        cb(file.blob, response.post_url, that.showUploadProgress);
                    }
                    else{
                        // Notify TBD                    
                    }
                }
            };
            xhr.send();
        },
        toggleMicrophone: function(on){
            // Temporary !
            if(on){
                $('#record-audio-answer').html(
                    '<i  class="fa fa-2x fa-microphone"></i>'
                    );
            }
            else{
                $('#record-audio-answer').html(
                    '<i  class="fa fa-2x fa-pause"></i>'
                    );
            }
        },
        clickMicrophone: function(){
            if(this.recording){
                this.recording = false;
                this.toggleMicrophone(true);
                // this.recordAudio.pauseRecording();
                this.saveAudioAnswer();
            }
            else{
                this.recording = true;
                this.toggleMicrophone(false);
                this.recordAudio.startRecording();
            }
        },
        saveAudioAnswer: function(){
            var that = this;
            that.recordAudio.stopRecording(
                function() {
                    if(that.recording){
                        that.recording = false;
                        that.toggleMicrophone(true);
                    }
                    that.recordAudio.clearRecordedData();
                    that.recordAudio.getDataURL(function(audioDataURL){
                        var blob = that.recordAudio.getBlob();
                        that.audioBlob = blob;
                        that.uploadAudioAnswer(blob);
                    });
            });
        },
        checkUploadAudioAnswer: function(){
            // Not implemented
        },
        compressAudioAnswer: function(){
            // Not implemented
        },
        showUploadProgress: function(percentComplete){
            // Temporary !
            $('#record-audio-answer').css(
                    "background", "green"
                );
            $('#record-audio-answer').html(
                    percentComplete
                );
        },
        showAudioAnswer: function(){
            this.recordAudio.clearRecordedData();
        },
        uploadAudioAnswer: function(file){
            var that = this,
                file_name = that.$messageId+'.wav';

            that.get_signed_request({
                name: file_name,
                type: 'wav',
                blob: file
            },
                that.uploadToS3
            );
        },
        uploadToS3: function(file, post_url, cb){
            $.ajax({
                xhr: function () {
                    var xhr = new window.XMLHttpRequest();
                    xhr.upload.addEventListener("progress", function (evt) {
                        if (evt.lengthComputable) {
                            var percentComplete = Math.round((evt.loaded / evt.total) * 100);
                            cb(percentComplete);
                        }
                    }, false);
                    return xhr;
                },
                url: post_url,
                type: 'PUT',
                data: file,
                processData: false,
                contentType: 'wav',
                success: function(){
                    swal('Answer Published!', 'Your answer has been published.',
                     'success');
                },
                fail: function(err){
                    swal('Shit!', 'Your answer could not be published due to a technical error.', 'error');
                }
            });
        },
        submitAnswer: function(e) {
            e.preventDefault();

            if(this.$questionAnswered) {
                sweetAlert("Oops...", "Question has already been answered!", "error");
                return;
            }

            if (!this.client.status.get('connected')) return;

            var $answer = this.$editor.getHTML();
            if (!this.$editor.getLength()) return;
            this.client.events.trigger('answers:publish', {
                room: this.$roomId,
                message: this.$messageId,
                text: $answer
            });
            this.$el.modal('hide');
            this.$editor.setHTML('');
        }
    })

}(window, $, _);
