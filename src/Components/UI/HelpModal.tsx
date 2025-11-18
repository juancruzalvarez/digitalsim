import { X } from "lucide-react";


export const HelpModal = ({setShowHelp}) => {
    return (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]"
          onClick={() => setShowHelp(false)}
        >
          <div
            className="bg-neutral-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-auto scrollbar-thin scrollbar-track-neutral-900 scrollbar-thumb-neutral-600 hover:scrollbar-thumb-neutral-500"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-neutral-700">
              <h2 className="text-xl font-bold text-white">
                Controls & Shortcuts
              </h2>
              <button
                onClick={() => setShowHelp(false)}
                className="text-neutral-400 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Canvas Controls */}
              <section>
                <h3 className="text-lg font-semibold text-white mb-3">
                  Canvas Controls
                </h3>
                <table className="w-full text-sm">
                  <tbody className="text-neutral-300">
                    <tr className="border-b border-neutral-700">
                      <td className="py-2 pr-4 font-medium">Pan Canvas</td>
                      <td className="py-2">
                        <code className="bg-neutral-700 px-2 py-1 rounded">
                          Middle Mouse + Drag
                        </code>{" "}
                        or{" "}
                        <code className="bg-neutral-700 px-2 py-1 rounded">
                          Space + Drag
                        </code>
                      </td>
                    </tr>
                    <tr className="border-b border-neutral-700">
                      <td className="py-2 pr-4 font-medium">Zoom</td>
                      <td className="py-2">
                        <code className="bg-neutral-700 px-2 py-1 rounded">
                          Mouse Wheel
                        </code>
                      </td>
                    </tr>
                    <tr className="border-b border-neutral-700">
                      <td className="py-2 pr-4 font-medium">Add Node</td>
                      <td className="py-2">
                        <code className="bg-neutral-700 px-2 py-1 rounded">
                          Right Click
                        </code>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </section>

              {/* Wire Controls */}
              <section>
                <h3 className="text-lg font-semibold text-white mb-3">
                  Wire Controls
                </h3>
                <table className="w-full text-sm">
                  <tbody className="text-neutral-300">
                    <tr className="border-b border-neutral-700">
                      <td className="py-2 pr-4 font-medium">Start Wire</td>
                      <td className="py-2">
                        <code className="bg-neutral-700 px-2 py-1 rounded">
                          Click Pin
                        </code>
                      </td>
                    </tr>
                    <tr className="border-b border-neutral-700">
                      <td className="py-2 pr-4 font-medium">Add Anchor</td>
                      <td className="py-2">
                        <code className="bg-neutral-700 px-2 py-1 rounded">
                          Click Empty Space
                        </code>{" "}
                        (while wiring)
                      </td>
                    </tr>
                    <tr className="border-b border-neutral-700">
                      <td className="py-2 pr-4 font-medium">Complete Wire</td>
                      <td className="py-2">
                        <code className="bg-neutral-700 px-2 py-1 rounded">
                          Click Pin
                        </code>
                      </td>
                    </tr>
                    <tr className="border-b border-neutral-700">
                      <td className="py-2 pr-4 font-medium">Edit Wire</td>
                      <td className="py-2">
                        <code className="bg-neutral-700 px-2 py-1 rounded">
                          Click Wire
                        </code>
                      </td>
                    </tr>
                    <tr className="border-b border-neutral-700">
                      <td className="py-2 pr-4 font-medium">Remove Anchor</td>
                      <td className="py-2">
                        <code className="bg-neutral-700 px-2 py-1 rounded">
                          Right Click Anchor
                        </code>{" "}
                        (in edit mode)
                      </td>
                    </tr>
                    <tr className="border-b border-neutral-700">
                      <td className="py-2 pr-4 font-medium">Cancel/Exit</td>
                      <td className="py-2">
                        <code className="bg-neutral-700 px-2 py-1 rounded">
                          ESC
                        </code>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </section>

              {/* Selection */}
              <section>
                <h3 className="text-lg font-semibold text-white mb-3">
                  Selection
                </h3>
                <table className="w-full text-sm">
                  <tbody className="text-neutral-300">
                    <tr className="border-b border-neutral-700">
                      <td className="py-2 pr-4 font-medium">Select Node</td>
                      <td className="py-2">
                        <code className="bg-neutral-700 px-2 py-1 rounded">
                          Click
                        </code>
                      </td>
                    </tr>
                    <tr className="border-b border-neutral-700">
                      <td className="py-2 pr-4 font-medium">
                        Add to Selection
                      </td>
                      <td className="py-2">
                        <code className="bg-neutral-700 px-2 py-1 rounded">
                          Shift + Click
                        </code>
                      </td>
                    </tr>
                    <tr className="border-b border-neutral-700">
                      <td className="py-2 pr-4 font-medium">
                        Toggle Selection
                      </td>
                      <td className="py-2">
                        <code className="bg-neutral-700 px-2 py-1 rounded">
                          Ctrl + Click
                        </code>
                      </td>
                    </tr>
                    <tr className="border-b border-neutral-700">
                      <td className="py-2 pr-4 font-medium">Box Select</td>
                      <td className="py-2">
                        <code className="bg-neutral-700 px-2 py-1 rounded">
                          Click + Drag
                        </code>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </section>

              {/* Keyboard Shortcuts */}
              <section>
                <h3 className="text-lg font-semibold text-white mb-3">
                  Keyboard Shortcuts
                </h3>
                <table className="w-full text-sm">
                  <tbody className="text-neutral-300">
                    <tr className="border-b border-neutral-700">
                      <td className="py-2 pr-4 font-medium">Save</td>
                      <td className="py-2">
                        <code className="bg-neutral-700 px-2 py-1 rounded">
                          Ctrl + S
                        </code>
                      </td>
                    </tr>
                    <tr className="border-b border-neutral-700">
                      <td className="py-2 pr-4 font-medium">Load</td>
                      <td className="py-2">
                        <code className="bg-neutral-700 px-2 py-1 rounded">
                          Ctrl + O
                        </code>
                      </td>
                    </tr>
                    <tr className="border-b border-neutral-700">
                      <td className="py-2 pr-4 font-medium">Undo</td>
                      <td className="py-2">
                        <code className="bg-neutral-700 px-2 py-1 rounded">
                          Ctrl + Z
                        </code>
                      </td>
                    </tr>
                    <tr className="border-b border-neutral-700">
                      <td className="py-2 pr-4 font-medium">Redo</td>
                      <td className="py-2">
                        <code className="bg-neutral-700 px-2 py-1 rounded">
                          Ctrl + Y
                        </code>
                      </td>
                    </tr>
                    <tr className="border-b border-neutral-700">
                      <td className="py-2 pr-4 font-medium">Copy</td>
                      <td className="py-2">
                        <code className="bg-neutral-700 px-2 py-1 rounded">
                          Ctrl + C
                        </code>
                      </td>
                    </tr>
                    <tr className="border-b border-neutral-700">
                      <td className="py-2 pr-4 font-medium">Paste</td>
                      <td className="py-2">
                        <code className="bg-neutral-700 px-2 py-1 rounded">
                          Ctrl + V
                        </code>
                      </td>
                    </tr>
                    <tr className="border-b border-neutral-700">
                      <td className="py-2 pr-4 font-medium">Duplicate</td>
                      <td className="py-2">
                        <code className="bg-neutral-700 px-2 py-1 rounded">
                          Ctrl + D
                        </code>
                      </td>
                    </tr>
                    <tr className="border-b border-neutral-700">
                      <td className="py-2 pr-4 font-medium">Delete</td>
                      <td className="py-2">
                        <code className="bg-neutral-700 px-2 py-1 rounded">
                          Delete
                        </code>{" "}
                        or{" "}
                        <code className="bg-neutral-700 px-2 py-1 rounded">
                          Backspace
                        </code>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </section>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-neutral-700 text-center">
              <button
                onClick={() => setShowHelp(false)}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
              >
                Got it!
              </button>
            </div>
          </div>
        </div>
    );
}