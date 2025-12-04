// const showSuccessToast = () => {
//     toast.success("Vote cast successfully! 🗳️", {
//       description: "Your vote has been recorded securely and you will receive a confirmation email.",
//       duration: 5000,
//     })
//   }

//   const showErrorToast = () => {
//     toast.error("Authentication failed ❌", {
//       description: "Invalid voter credentials. Please check your Student ID and password.",
//       duration: 6000,
//     })
//   }

//   const showWarningToast = () => {
//     toast.warning("Election ending soon! ⚠️", {
//       description: "Voting closes in 2 hours. Make sure to cast your vote before 11:59 PM.",
//       duration: 8000,
//     })
//   }

//   const showInfoToast = () => {
//     toast.info("Election update 📊", {
//       description: "NACOS UNILAG election is active. Current turnout: 73% (1,247 voters)",
//       duration: 5000,
//     })
//   }

//   const showLoadingToast = () => {
//     const loadingToast = toast.loading("Processing your vote...", {
//       description: "Please wait while we securely record your ballot."
//     })

//     // Simulate processing time
//     setTimeout(() => {
//       toast.dismiss(loadingToast)
//       toast.success("Vote processed successfully! 🎉")
//     }, 3000)
//   }

//   const showCustomToast = () => {
//     toast.custom((t) => (
//       <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 rounded-lg shadow-lg">
//         <div className="flex items-center space-x-3">
//           <span className="text-2xl">🎓</span>
//           <div>
//             <h4 className="font-semibold">Welcome to NACOS Platform!</h4>
//             <p className="text-sm opacity-90">Your secure e-voting experience starts here.</p>
//           </div>
//           <button
//             onClick={() => toast.dismiss(t)}
//             className="ml-auto text-white/80 hover:text-white"
//           >
//             ✕
//           </button>
//         </div>
//       </div>
//     ))
//   }
