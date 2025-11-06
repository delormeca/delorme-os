#@title Delorme Entities Extractor { vertical-output: true }

import requests
import pandas as pd
import ipywidgets as widgets
from IPython.display import display, clear_output

# Input fields for API key and content
api_key_input = widgets.Password(description='API Key:', placeholder='Your Google NLP API Key', layout=widgets.Layout(width='80%'))
content_input = widgets.Textarea(description='Content:', placeholder='Paste your content here', layout=widgets.Layout(width='80%', height='200px'))

# Button to trigger analysis
analyze_button = widgets.Button(description='Extract Entities', button_style='success')

# Output area for results
output_area = widgets.Output()

def analyze_entities(api_key, content):
    url = f"https://language.googleapis.com/v1/documents:analyzeEntities?key={api_key}"

    headers = {'Content-Type': 'application/json'}

    data = {
        'document': {
            'type': 'PLAIN_TEXT',
            'content': content,
        },
        'encodingType': 'UTF8',
    }

    response = requests.post(url, headers=headers, json=data)
    result = response.json()

    entities_data = []
    for entity in result.get('entities', []):
        entities_data.append({
            'entity': entity['name'].upper(),
            'type': entity['type'],
            'salience': entity['salience'],
            'mentions': len(entity['mentions'])
        })

    df = pd.DataFrame(entities_data)

    # Aggregate entities properly
    df = df.groupby(['entity', 'type'], as_index=False).agg({
        'salience': 'sum',
        'mentions': 'sum'
    })

    # Delorme-style scoring
    df['delorme_score'] = df['salience'] * df['mentions']
    df['delorme_salience_percent'] = (df['delorme_score'] / df['delorme_score'].sum()) * 100
    df_sorted = df.sort_values(by='delorme_salience_percent', ascending=False)

    return df_sorted

# Action on button click
def on_analyze_clicked(b):
    with output_area:
        clear_output()
        api_key = api_key_input.value.strip()
        content = content_input.value.strip()

        if not api_key or not content:
            print("Please provide both API key and content.")
            return

        try:
            df_results = analyze_entities(api_key, content)

            for _, row in df_results.iterrows():
                print(f"{row['entity']} ({row['type']})")
                print(f"Salience: {row['delorme_salience_percent']:.1f}%")
                print(f"Keyword Mentions: {row['mentions']}\n")

        except Exception as e:
            print(f"Error: {e}")

analyze_button.on_click(on_analyze_clicked)

# Display the UI
display(api_key_input, content_input, analyze_button, output_area)
