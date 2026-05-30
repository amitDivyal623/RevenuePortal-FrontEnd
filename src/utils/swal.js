import Swal from 'sweetalert2'

export const swal = {
  success: (msg = 'Saved successfully') =>
    Swal.fire({
      icon: 'success',
      title: msg,
      showConfirmButton: false,
      timer: 2000,
      timerProgressBar: true,
    }),

  error: (msg = 'An error occurred. Please try again.') =>
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: msg,
    }),
}
