/* 
 * Bind a submit function to a form embedded in a Bootstrap modal, which in 
 * turn uses AJAX POST request to submit the form data. When the form has been
 * successully submitted, the modal is hidden. If the submitted form has errors
 * the form is re-rendered with field errors highlighted as per Bootstrap
 * rendering guidelines.
 *
   Parameters:
    form: jQuery selector to the form that is to be submited via AJAX
    modal: jQuery selector to the modal dialog to be dismissed post successful
           form submission
    complete: A function to be called upon successful form submission.
 */
var submitModalForm = function(form, modal, complete) {
    $(form).submit(function(e) {
        e.preventDefault();
        $.ajax({
            type: $(this).attr('method'),
            url: $(this).attr('action'),
            data: $(this).serialize(),
            success: function (xhr, ajaxOptions, thrownError) {
                if ( $(xhr).find('.has-error').length > 0 ||
                     $(xhr).find('.alert').length > 0) {
                    $(modal).find('.block-content').html(xhr);
                    submitModalForm(form, modal, complete);
                } else {
                    $(modal).modal('hide');
                    if (typeof complete == "function") {
                        complete(xhr); // notify caller
                    }
                }
            },
            error: function (xhr, ajaxOptions, thrownError) {
              // todo
            }
        });
    });
}
$(document).ready(function() {
  // same handler for New Object and Edit Object
  $("[name=create_edit_object]").click(function(evtObj) {
    evtObj.preventDefault();
    var url = $(this).data('url');
    var title = $(this).data('title');
    $('#create-edit-modal .modal-body').load(url, function () {
      $('#create-edit-modal .modal-title').text(title);
      bindAddAnother($("#create-edit-modal"));
      $('#create-edit-modal').modal('show');
      submitModalForm('#create-edit-form', '#create-edit-modal', 
        function(xhr) {
          location.reload();
        });
    });
  });
  // delete an object action handler
  $("a[name='delete_object']").click(function(evtObj) {
    evtObj.preventDefault();
    $('#delete-modal #id_object_name').text(
      $(evtObj.target).parents('tr').children(':nth-child(1)').text());
    $('#delete-modal .modal-body form').attr(
      'action', $(evtObj.target).parent('a').data('url'));
    $('#delete-modal').modal('show');
    submitModalForm('#delete-form', '#delete-modal', 
      function(xhr) {
        var result = xhr.result;
        $("#delete-result-modal #id_delete_result").html(xhr.message);
        $('#delete-result-modal').on('hidden.bs.modal', xhr.result ? 
          function(evtObj) { 
            $('#delete-result-modal').off('hidden.bs.modal');
            location.reload();
          } : 
          function(evtObj) { 
            $('#delete-result-modal').off('hidden.bs.modal');
          });
        $('#delete-result-modal').modal('show');
      }
    );
  });
  // Binds all '.add-another' hyperlinks under the given 'elem' with their own
  // modals, each of which will hold the form for the .add-another's data-url
  // value. Each such modal is given an id composed as the value of the 'a' 
  // tag's 'id' value + '-modal'. The modal will be added only if a modal with
  // the same id does not exist so as to avoid duplicate modals.
  //
  // The 'a' tag is assigned the newly added modal's id, so that the associated
  // modal dialog can be loaded with the respective url form content and 
  // activated in a generic manner from a Javascript function.
  var bindAddAnother = function(elem) {
    // modal dialog template that'll be added at the end of the <body> tag
    var createRelatedModal = `
      <div class="modal fade" id="create-related-modal" tabindex="-1" role="dialog" aria-hidden="true">
        <div class="modal-dialog modal-dialog-top" role="document">
            <div class="modal-content">
                <div class="modal-header bg-primary">
                    <button type="button" class="close" data-dismiss="modal" aria-label=""><span aria-hidden="true">×</span></button>
                    <h4 class="modal-title">Title</h4>
                </div>
                <div class="modal-body">
                </div>
            </div>
        </div>
      </div>
    `;
    elem.find(".add-another").each(function(index, elem) {
      var modalId = $(elem).attr('id') + '-modal';
      if ($("#"+modalId).length == 0) {
        $("body").append(createRelatedModal.replace('create-related-modal', modalId))
      }
      $(elem).data('modal', modalId);
    });
    // Generic function that loads the form associated with a hyperlink into
    // the related modal.
    //
    // Constraints & Behavior:
    //  1. <a> element is preceded immediately by a <select> element
    //  2. <a> element has the following data attributes:
    //      a. data-url: the URL to load the form from
    //      b. data-modal: id of the associated modal that is loaded with the 
    //         form and activated.
    //  3. The activated modal's title is set to <a> element's text content.
    //  4. If the activated form submission was successful, the sibling 'select'
    //     element is popuplated with an <option> for the just added element.
    $(".add-another").click(function(evtObj) {
      var url = $(this).data('url');
      var title = $(this).text();
      var select = $(this).prev('select');
      var modalId = $(this).data('modal');
      var modal = $('#' + modalId);
      modal.find('.modal-body').load(url, function () {
        modal.find('.modal-title').text(title);
        bindAddAnother(modal);
        modal.modal('show');
        submitModalForm(modal.find('#create-edit-form'), '#'+modalId, 
          function(xhr) {
            $(select).append($("<option></option>").
              attr("value", xhr.pk).text(xhr.name)).val(xhr.pk).trigger('change');
          })
      });
    });
  }
  // Bind any embedded .add-another links in the document to its own modal. 
  bindAddAnother($('body')); 

  /* Adjusts the just activated modal window's z-index to a value higher 
     than the previously activated modal window's z-index. This will 
     ensure that each newly activated modal is layered on top of all 
     previously activated modals achieving the layered dialog effect.

     Code borrowed from: http://jsfiddle.net/CxdUQ/
     */
  $(document).on('show.bs.modal', '.modal', function (event) {
    // calculate z-index as a function of number of visible modal windows.
    var zIndex = 1040 + (10 * $('.modal:visible').length);
    $(this).css('z-index', zIndex);
    setTimeout(function() {
      $('.modal-backdrop').not('.modal-stack').css('z-index', zIndex - 1).addClass('modal-stack');
    }, 0);
  });
});
