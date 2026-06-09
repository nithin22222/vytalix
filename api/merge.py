import os

def merge():
    with open('dashboard_stitch.html', 'r', encoding='utf-8') as f:
        html = f.read()

    with open('form_snippet.html', 'r', encoding='utf-8') as f:
        form_html = f.read()

    with open('vytalix_script.js', 'r', encoding='utf-8') as f:
        script_js = f.read()

    # Wrap the form in a modal
    modal_html = f"""
    <!-- Data Entry Modal -->
    <div id="data-entry-modal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm hidden">
        <div class="bg-surface border border-outline-variant p-8 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div class="flex justify-between items-center mb-6">
                <h2 class="text-2xl font-bold text-on-surface">Clinical Data Entry</h2>
                <button onclick="document.getElementById('data-entry-modal').classList.add('hidden')" class="text-outline hover:text-white">
                    <span class="material-symbols-outlined">close</span>
                </button>
            </div>
            <!-- Old Form Snippet (wrapped to prevent css conflicts as much as possible) -->
            <div id="legacy-form-wrapper" style="color: white;">
                {form_html}
            </div>
        </div>
    </div>
    """

    # Add script wrapper
    full_script = f"""
    <script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
    <style>
      .hidden {{ display: none !important; }}
      .custom-scrollbar::-webkit-scrollbar {{ width: 8px; }}
      .custom-scrollbar::-webkit-scrollbar-track {{ background: #131313; }}
      .custom-scrollbar::-webkit-scrollbar-thumb {{ background: #353534; border-radius: 4px; }}
      #legacy-form-wrapper {{
        /* Basic reset for old CSS that we didn't bring over */
        font-family: sans-serif;
      }}
      #legacy-form-wrapper .card {{
         background: #111;
         padding: 20px;
         border-radius: 10px;
         border: 1px solid #333;
      }}
      #legacy-form-wrapper input, #legacy-form-wrapper select {{
         background: #222;
         color: white;
         border: 1px solid #444;
         padding: 8px;
         border-radius: 4px;
         width: 100%;
      }}
      #legacy-form-wrapper .form-grid {{
         display: grid; grid-template-columns: 1fr 1fr; gap: 12px;
      }}
      #legacy-form-wrapper .form-section-title {{
         color: #00dbe9; font-weight: bold; margin: 15px 0 5px 0; text-transform: uppercase; font-size: 12px;
      }}
      #legacy-form-wrapper .btn-predict {{
         background: #00dbe9; color: black; padding: 12px; border-radius: 6px; font-weight: bold; cursor: pointer; border: none;
      }}
    </style>
    <script>
    {script_js}
    
    // Override runPrediction to also update Stitch UI
    const originalRunPrediction = runPrediction;
    runPrediction = async function() {{
        await originalRunPrediction();
        
        // Hide modal
        document.getElementById('data-entry-modal').classList.add('hidden');
        
        // Update Stitch UI with results
        // Wait for results to be available in global scope if any, 
        // or we can hook into the fetch response.
        // Actually runPrediction updates DOM elements, so let's read from DOM or patch the UI.
        
        // For demonstration, we'll patch the Stitch UI manually
        const predText = document.querySelector('.diagnosis-name')?.innerText || 'Analysis Complete';
        
        // Find elements in Stitch UI and update
        const stitchTitle = document.querySelector('h3.font-display-lg.text-\\\\[28px\\\\].text-on-surface');
        if (stitchTitle && stitchTitle.innerText.includes('Clinical Analysis')) {{
            stitchTitle.innerText = `Analysis: ${{predText}}`;
        }}
    }}
    
    // Bind Stitch buttons to open modal
    document.querySelectorAll('button').forEach(btn => {{
        if (btn.innerText.includes('RUN AI ANALYSIS') || btn.innerText.includes('RUN FULL DIAGNOSTICS')) {{
            btn.onclick = () => document.getElementById('data-entry-modal').classList.remove('hidden');
        }}
    }});
    </script>
    """

    # Insert before </body>
    html = html.replace('</body>', modal_html + '\n' + full_script + '\n</body>')

    with open('vytalix_dashboard.html', 'w', encoding='utf-8') as f:
        f.write(html)

if __name__ == '__main__':
    merge()
