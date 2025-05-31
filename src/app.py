import os
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from itertools import permutations
from flask import Flask, render_template, request

app = Flask(__name__)
# expose zip() to Jinja
app.jinja_env.globals.update(zip=zip)

# ensure output folder exists
os.makedirs('static/img', exist_ok=True)

@app.route('/', methods=['GET','POST'])
def index():
    # Default placeholders
    default_constraints = ['A', 'B', 'C', 'D', 'E']
    default_designs     = ['Design 1', 'Design 2', 'Design 3']

    if request.method == 'POST':
        # 1) Read form inputs
        names        = request.form.getlist('constraint_names')    # 5 constraint labels
        prefs        = request.form.getlist('constraint_prefs')    # 'min' or 'max'
        importances  = [int(i) for i in request.form.getlist('constraint_imps')]
        design_names = request.form.getlist('design_names')       # 3 design labels

        # Collect values for each constraint and design
        vals = []
        for i in range(5):
            row = []
            for d in range(3):
                v = request.form.getlist(f'summary_{i}_{d}')
                if v and v[0] != '':
                    try:
                        v_float = float(v[0])
                    except (ValueError, TypeError):
                        v_float = 0.0
                else:
                    v_float = 0.0
                row.append(v_float)
            vals.append(row)

        # DEBUG: Print all incoming form data
        print('--- FORM DATA ---')
        for k in request.form:
            print(f'{k}: {request.form.getlist(k)}')
        print('-----------------')

        # DEBUG: Print the vals matrix
        print('--- VALS MATRIX ---')
        for i, row in enumerate(vals):
            print(f'Constraint {i}: {row}')
        print('-------------------')

        # Build raw_data: {constraint_name: [v1, v2, v3], ...}
        raw_data = {
            name: row
            for name, row in zip(names, vals)
        }
        df_raw  = pd.DataFrame(raw_data, index=design_names)
        df_norm = pd.DataFrame(index=df_raw.index, columns=names, dtype=float)

        for col, pref in zip(names, prefs):
            col_vals = df_raw[col]
            mn, mx = col_vals.min(), col_vals.max()
            if mx == mn:
                df_norm[col] = 5.0
            elif pref == 'max':
                df_norm[col] = 9 * (col_vals - mn) / (mx - mn) + 1
            else:
                df_norm[col] = 9 * (mx - col_vals) / (mx - mn) + 1
            df_norm[col] = df_norm[col].round(6)

        # 3) Compute weighted, normalized scores
        total_imp = sum(importances)
        pcts      = [imp / total_imp * 100 for imp in importances]
        # norms as list-of-5 rows, each [score1,score2,score3]
        norms     = df_norm.T.values.tolist()

        scores = []
        for d in range(len(design_names)):
            s = sum(norms[i][d] * pcts[i] / 100 for i in range(len(norms)))
            scores.append(round(s, 3))

        # 4) Regenerate sensitivity chart
        _generate_sensitivity_chart(df_raw, prefs, names)

        # 5) Render results, passing design_names through
        return render_template(
            'results.html',
            design_names=design_names,
            names=names,
            importances=importances,
            pcts=[round(x, 1) for x in pcts],
            norms=norms,
            scores=scores,
            total_imp=total_imp,
            raw_data=raw_data
        )

    # GET → empty form
    return render_template(
        'input.html',
        letters=default_constraints,
        design_defaults=default_designs
    )



def _generate_sensitivity_chart(df_raw, prefs, names):
    """
    Runs a full sensitivity analysis (all permutations of [10,9,8,7,6])
    and saves a radar chart to static/img/sensitivity_analysis.png
    """
    # 1) Normalize once more for analysis
    df_norm = pd.DataFrame(index=df_raw.index, columns=names, dtype=float)
    for col, pref in zip(names, prefs):
        vals = df_raw[col]
        mn, mx = vals.min(), vals.max()
        if mx == mn:
            df_norm[col] = 5.0
        elif pref == 'max':
            df_norm[col] = 9 * (vals - mn) / (mx - mn) + 1
        else:
            df_norm[col] = 9 * (mx - vals) / (mx - mn) + 1
        df_norm[col] = df_norm[col].round(6)

    # 2) Sensitivity over all 120 permutations
    perms = list(permutations([10,9,8,7,6]))
    scores = {d: [] for d in df_raw.index}
    for perm in perms:
        total = sum(perm)
        w = [x/total*100 for x in perm]
        ds = df_norm.dot(w)/100
        for d in df_raw.index:
            scores[d].append(ds[d])

    # 3) Plot radar
    angles = np.linspace(0, 2*np.pi, len(perms), endpoint=False).tolist()
    angles += angles[:1]

    fig, ax = plt.subplots(figsize=(8,8), subplot_kw={'polar':True})
    for design, vals in scores.items():
        data = vals + [vals[0]]
        ax.plot(angles, data, label=design)
    ax.set_theta_offset(np.pi/2)
    ax.set_theta_direction(-1)
    # label every 10th permutation
    xticks = angles[:-1:10]
    xtlabs = [f's{i+1}' for i in range(0, len(perms), 10)]
    ax.set_xticks(xticks)
    ax.set_xticklabels(xtlabs)
    ax.set_yticks(np.arange(0,11,1))
    ax.set_ylim(0,10)
    ax.set_title("Sensitivity Analysis (120 Weight Combinations)", weight='bold')
    ax.grid(True, linestyle='--', linewidth=0.5)
    ax.legend(loc='upper right', fontsize=9, bbox_to_anchor=(1.3,1.1))

    plt.tight_layout()
    fig.savefig('static/img/sensitivity_analysis.png', dpi=300)
    plt.close(fig)


import threading
import webbrowser

def open_browser():
    webbrowser.open_new("http://127.0.0.1:5000")

if __name__ == '__main__':
    threading.Timer(1.0, open_browser).start()
    app.run(debug=False)
