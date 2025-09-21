import os
from flask import Blueprint, request, jsonify
import re

analysis_bp = Blueprint('analysis', __name__)

@analysis_bp.route('/analyze', methods=['POST'])
def analyze_text():
    """
    Analyze text for writing quality, grammar, and structure
    """
    try:
        data = request.get_json()
        text = data.get('text', '')
        
        if not text:
            return jsonify({'error': 'No text provided'}), 400
        
        # Basic text statistics
        basic_stats = calculate_basic_stats(text)
        
        # Enhanced analysis (simulated AI analysis for demo)
        ai_analysis = perform_enhanced_analysis(text)
        
        # Combine results
        result = {
            'basic_stats': basic_stats,
            'ai_analysis': ai_analysis,
            'status': 'success'
        }
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({'error': str(e), 'status': 'error'}), 500

def calculate_basic_stats(text):
    """Calculate basic text statistics"""
    words = text.split()
    sentences = re.split(r'[.!?]+', text)
    sentences = [s.strip() for s in sentences if s.strip()]
    paragraphs = text.split('\n\n')
    paragraphs = [p.strip() for p in paragraphs if p.strip()]
    
    # Calculate readability score (Flesch Reading Ease)
    avg_sentence_length = len(words) / len(sentences) if sentences else 0
    avg_syllables_per_word = sum(count_syllables(word) for word in words) / len(words) if words else 0
    
    readability_score = max(0, min(100, 
        206.835 - (1.015 * avg_sentence_length) - (84.6 * avg_syllables_per_word)
    ))
    
    return {
        'word_count': len(words),
        'sentence_count': len(sentences),
        'paragraph_count': len(paragraphs),
        'character_count': len(text),
        'avg_words_per_sentence': round(avg_sentence_length, 1),
        'readability_score': round(readability_score, 1),
        'estimated_reading_time': max(1, round(len(words) / 200))  # 200 words per minute
    }

def count_syllables(word):
    """Count syllables in a word"""
    word = word.lower().strip('.,!?;:"')
    if len(word) <= 3:
        return 1
    
    word = re.sub(r'(?:[^laeiouy]es|ed|[^laeiouy]e)$', '', word)
    word = re.sub(r'^y', '', word)
    syllables = len(re.findall(r'[aeiouy]{1,2}', word))
    
    return max(1, syllables)

def perform_enhanced_analysis(text):
    """Perform enhanced text analysis with simulated AI insights"""
    
    # Calculate quality score based on various factors
    words = text.split()
    sentences = re.split(r'[.!?]+', text)
    sentences = [s.strip() for s in sentences if s.strip()]
    
    # Quality scoring factors
    avg_sentence_length = len(words) / len(sentences) if sentences else 0
    vocabulary_diversity = len(set(words)) / len(words) if words else 0
    
    # Base quality score
    quality_score = 7  # Start with average
    
    # Adjust based on sentence length (ideal: 15-20 words)
    if 15 <= avg_sentence_length <= 20:
        quality_score += 1
    elif avg_sentence_length < 10 or avg_sentence_length > 25:
        quality_score -= 1
    
    # Adjust based on vocabulary diversity
    if vocabulary_diversity > 0.7:
        quality_score += 1
    elif vocabulary_diversity < 0.5:
        quality_score -= 1
    
    # Ensure score is within bounds
    quality_score = max(1, min(10, quality_score))
    
    # Determine tone and style
    tone_style = determine_tone_style(text)
    
    # Generate grammar assessment
    grammar_assessment = assess_grammar(text)
    
    # Generate structure analysis
    structure_analysis = analyze_structure(text)
    
    # Generate strengths and improvements
    strengths, improvements = generate_feedback(text, avg_sentence_length, vocabulary_diversity)
    
    # Extract main topics
    main_topics = extract_topics_from_text(text)
    
    # Generate suggestions
    suggestions = generate_suggestions(text, avg_sentence_length, vocabulary_diversity)
    
    return {
        "quality_score": quality_score,
        "grammar_assessment": grammar_assessment,
        "tone_and_style": tone_style,
        "structure_analysis": structure_analysis,
        "strengths": strengths,
        "improvements": improvements,
        "main_topics": main_topics,
        "suggestions": suggestions
    }

def determine_tone_style(text):
    """Determine the tone and style of the text"""
    formal_indicators = ['therefore', 'furthermore', 'consequently', 'moreover', 'however']
    informal_indicators = ['really', 'pretty', 'quite', 'very', 'just']
    
    formal_count = sum(1 for word in formal_indicators if word in text.lower())
    informal_count = sum(1 for word in informal_indicators if word in text.lower())
    
    if formal_count > informal_count:
        return "Formal and professional"
    elif informal_count > formal_count:
        return "Conversational and informal"
    else:
        return "Balanced and neutral"

def assess_grammar(text):
    """Provide basic grammar assessment"""
    sentences = re.split(r'[.!?]+', text)
    sentences = [s.strip() for s in sentences if s.strip()]
    
    # Check for basic grammar patterns
    issues = []
    
    # Check for sentence fragments (very short sentences)
    short_sentences = [s for s in sentences if len(s.split()) < 4]
    if len(short_sentences) > len(sentences) * 0.3:
        issues.append("Some sentences may be too short")
    
    # Check for run-on sentences (very long sentences)
    long_sentences = [s for s in sentences if len(s.split()) > 30]
    if long_sentences:
        issues.append("Some sentences may be too long")
    
    if not issues:
        return "Grammar appears to be generally correct with good sentence structure"
    else:
        return "Consider reviewing: " + "; ".join(issues)

def analyze_structure(text):
    """Analyze document structure"""
    paragraphs = text.split('\n\n')
    paragraphs = [p.strip() for p in paragraphs if p.strip()]
    
    # Check for headings (lines starting with #)
    headings = [line for line in text.split('\n') if line.strip().startswith('#')]
    
    structure_notes = []
    
    if headings:
        structure_notes.append(f"Document has {len(headings)} heading(s)")
    
    if len(paragraphs) > 1:
        structure_notes.append(f"Well-organized with {len(paragraphs)} paragraph(s)")
    else:
        structure_notes.append("Single paragraph structure")
    
    return "; ".join(structure_notes) if structure_notes else "Basic document structure"

def generate_feedback(text, avg_sentence_length, vocabulary_diversity):
    """Generate strengths and improvement suggestions"""
    strengths = []
    improvements = []
    
    # Analyze strengths
    if 15 <= avg_sentence_length <= 20:
        strengths.append("Good sentence length variation")
    
    if vocabulary_diversity > 0.7:
        strengths.append("Rich vocabulary usage")
    
    if len(text.split('\n\n')) > 1:
        strengths.append("Clear paragraph organization")
    
    # Default strengths if none identified
    if not strengths:
        strengths = ["Clear communication", "Readable content"]
    
    # Analyze improvements
    if avg_sentence_length < 10:
        improvements.append("Consider combining some short sentences")
    elif avg_sentence_length > 25:
        improvements.append("Consider breaking down long sentences")
    
    if vocabulary_diversity < 0.5:
        improvements.append("Try using more varied vocabulary")
    
    # Default improvements if none identified
    if not improvements:
        improvements = ["Consider adding more specific examples", "Review for clarity and conciseness"]
    
    return strengths[:3], improvements[:3]  # Limit to 3 each

def generate_suggestions(text, avg_sentence_length, vocabulary_diversity):
    """Generate specific writing suggestions"""
    suggestions = []
    
    if avg_sentence_length > 20:
        suggestions.append("Break down complex sentences for better readability")
    
    if vocabulary_diversity < 0.6:
        suggestions.append("Use synonyms to avoid word repetition")
    
    if len(text.split('\n\n')) == 1 and len(text.split()) > 100:
        suggestions.append("Consider breaking content into multiple paragraphs")
    
    # Default suggestions
    if not suggestions:
        suggestions = [
            "Proofread for any typos or errors",
            "Consider your target audience when reviewing",
            "Read aloud to check flow and rhythm"
        ]
    
    return suggestions[:3]  # Limit to 3 suggestions

def extract_topics_from_text(text):
    """Extract key topics from text using simple keyword analysis"""
    words = re.findall(r'\b[a-zA-Z]{4,}\b', text.lower())
    word_freq = {}
    
    # Common stop words to exclude
    stop_words = {'this', 'that', 'with', 'have', 'will', 'from', 'they', 'been', 'were', 'said', 'each', 'which', 'their', 'time', 'would', 'there', 'could', 'other', 'more', 'very', 'what', 'know', 'just', 'first', 'into', 'over', 'think', 'also', 'your', 'work', 'life', 'only', 'can', 'still', 'should', 'after', 'being', 'now', 'made', 'before', 'here', 'through', 'when', 'where', 'much', 'some', 'these', 'many', 'then', 'them', 'well', 'were'}
    
    for word in words:
        if word not in stop_words and len(word) > 4:
            word_freq[word] = word_freq.get(word, 0) + 1
    
    # Get top 5 most frequent words
    top_topics = sorted(word_freq.items(), key=lambda x: x[1], reverse=True)[:5]
    return [topic[0] for topic in top_topics]

