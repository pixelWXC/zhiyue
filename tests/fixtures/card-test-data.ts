/**
 * 测试数据集 - 卡片生成功能
 * 
 * 提供各种场景的测试句子和预期结果
 */

export const TEST_CASES = [
    {
        id: 'simple-verb',
        name: '简单动词句',
        sentence: '猫がりんごを食べる',
        targetWord: '食べる',
        expectedFields: {
            targetWord: '食べる',
            reading: 'たべる',
            // sentence, meaning, hint, sceneDescription 由 AI 生成
        },
        validationRules: {
            readingLength: [2, 10],
            meaningMaxLength: 30,
            sceneDescriptionKeywords: ['minimalist', 'sketch', 'doodle', 'hand-drawn', 'white']
        }
    },

    {
        id: 'complex-past-tense',
        name: '复杂过去时句子',
        sentence: '昨日友達と一緒に映画を見に行きました',
        targetWord: '見る',
        expectedFields: {
            targetWord: '見る',
            reading: 'みる',
        },
        validationRules: {
            hintShouldMention: ['過去形', '動詞', '見る'],
            sceneDescriptionKeywords: ['minimalist', 'doodle', 'white']
        }
    },

    {
        id: 'adjective',
        name: '形容词句',
        sentence: 'この花はとても美しい',
        targetWord: '美しい',
        expectedFields: {
            targetWord: '美しい',
            reading: 'うつくしい',
        },
        validationRules: {
            meaningMaxLength: 30,
            sceneDescriptionShouldDescribe: 'flower'
        }
    },

    {
        id: 'noun',
        name: '名词为中心',
        sentence: '学校は月曜日から金曜日まで開いています',
        targetWord: '学校',
        expectedFields: {
            targetWord: '学校',
            reading: 'がっこう',
        },
        validationRules: {
            sceneDescriptionShouldDescribe: 'school'
        }
    },

    {
        id: 'long-sentence',
        name: '长句子',
        sentence: '私の兄は毎朝早く起きて、公園で30分くらいジョギングをしてから会社に行きます',
        targetWord: 'ジョギング',
        expectedFields: {
            targetWord: 'ジョギング',
            reading: 'ジョギング',
        },
        validationRules: {
            sceneDescriptionShouldDescribe: ['jogging', 'running', 'park']
        }
    },

    {
        id: 'auto-select',
        name: 'AI 自动选择目标词',
        sentence: '雨が降っている',
        targetWord: undefined, // Let AI choose
        expectedFields: {
            // AI should choose either '雨' or '降る'
        },
        validationRules: {
            targetWordShouldBeIn: ['雨', '降る', '降っている'],
            sceneDescriptionKeywords: ['rain', 'minimalist', 'white']
        }
    },

    {
        id: 'conversational',
        name: '对话式句子',
        sentence: 'ちょっと待ってください',
        targetWord: '待つ',
        expectedFields: {
            targetWord: '待つ',
            reading: 'まつ',
        },
        validationRules: {
            hintShouldMention: ['動詞', 'て形'],
            meaningMaxLength: 20
        }
    },

    {
        id: 'special-characters',
        name: '包含特殊字符',
        sentence: '「こんにちは」と言いました',
        targetWord: '言う',
        expectedFields: {
            targetWord: '言う',
            reading: 'いう',
        },
        validationRules: {
            sentenceShouldPreserve: '「こんにちは」',
            sceneDescriptionKeywords: ['speak', 'say', 'minimalist']
        }
    },

    {
        id: 'compound-verb',
        name: '复合动词',
        sentence: '友達と話し合いました',
        targetWord: '話し合う',
        expectedFields: {
            targetWord: '話し合う',
            reading: 'はなしあう',
        },
        validationRules: {
            hintShouldExplain: 'compound verb'
        }
    },

    {
        id: 'keigo',
        name: '敬语句子',
        sentence: '先生がおっしゃいました',
        targetWord: 'おっしゃる',
        expectedFields: {
            targetWord: 'おっしゃる',
            reading: 'おっしゃる',
        },
        validationRules: {
            hintShouldMention: ['敬語', '尊敬語', '「言う」'],
        }
    }
]

/**
 * 边缘情况测试
 */
export const EDGE_CASES = [
    {
        id: 'empty-sentence',
        name: '空句子',
        sentence: '',
        targetWord: undefined,
        shouldFail: true,
        expectedBehavior: 'Should not call API'
    },

    {
        id: 'whitespace-only',
        name: '仅空格',
        sentence: '   ',
        targetWord: undefined,
        shouldFail: true,
        expectedBehavior: 'Should not call API'
    },

    {
        id: 'single-character',
        name: '单字符',
        sentence: '猫',
        targetWord: '猫',
        shouldSucceed: true,
        validationRules: {
            allFieldsShouldExist: true
        }
    },

    {
        id: 'very-long',
        name: '超长句子（100+字）',
        sentence: '昨日の夜、私の友達と一緒に新しくオープンした駅前のイタリアンレストランに行って、美味しいパスタとピザを食べて、デザートにティラミスも注文して、とても楽しい時間を過ごしました。そのレストランの雰囲気はとても良くて、料理も素晴らしかったです。',
        targetWord: '食べる',
        shouldSucceed: true,
        validationRules: {
            meaningMaxLength: 30 // Should still be concise
        }
    },

    {
        id: 'hiragana-only',
        name: '纯平假名',
        sentence: 'ねこがりんごをたべる',
        targetWord: 'たべる',
        shouldSucceed: true
    },

    {
        id: 'katakana-word',
        name: '片假名词汇',
        sentence: 'コーヒーを飲みます',
        targetWord: 'コーヒー',
        expectedFields: {
            targetWord: 'コーヒー',
            reading: 'コーヒー', // Katakana reads as itself
        }
    }
]

/**
 * 性能基准测试数据
 */
export const PERFORMANCE_TESTS = [
    {
        name: 'Batch Generation',
        description: '批量生成 10 张卡片，测试稳定性',
        sentences: [
            '猫がりんごを食べる',
            '私は学校へ行きます',
            '雨が降っている',
            'この花はとても美しい',
            '友達と話し合いました',
            '昨日映画を見に行きました',
            'コーヒーを飲みます',
            '本を読んでいます',
            '明日公園で会いましょう',
            '彼は毎日運動します'
        ],
        expectations: {
            successRate: 100, // Should be 100%
            avgResponseTime: 8000, // Average < 8 seconds (Flash)
            maxResponseTime: 15000, // Max < 15 seconds
            allFieldsValid: true
        }
    }
]

/**
 * 验证辅助函数
 */
export function validateFlashcardData(data: any, rules: any = {}): {
    valid: boolean
    errors: string[]
} {
    const errors: string[] = []

    // Required fields check
    const requiredFields = ['targetWord', 'reading', 'sentence', 'meaning', 'hint', 'sceneDescription']
    for (const field of requiredFields) {
        if (!data[field] || data[field].trim() === '') {
            errors.push(`Missing or empty field: ${field}`)
        }
    }

    // Reading length check
    if (rules.readingLength) {
        const [min, max] = rules.readingLength
        const len = data.reading?.length || 0
        if (len < min || len > max) {
            errors.push(`Reading length ${len} not in range [${min}, ${max}]`)
        }
    }

    // Meaning max length
    if (rules.meaningMaxLength) {
        const len = data.meaning?.length || 0
        if (len > rules.meaningMaxLength) {
            errors.push(`Meaning too long: ${len} > ${rules.meaningMaxLength}`)
        }
    }

    // Scene description keywords
    if (rules.sceneDescriptionKeywords) {
        const desc = data.sceneDescription?.toLowerCase() || ''
        const hasAnyKeyword = rules.sceneDescriptionKeywords.some((kw: string) =>
            desc.includes(kw.toLowerCase())
        )
        if (!hasAnyKeyword) {
            errors.push(`Scene description missing required style keywords`)
        }
    }

    return {
        valid: errors.length === 0,
        errors
    }
}

/**
 * 测试运行器示例
 */
export async function runTestSuite(aiStore: any) {
    console.log('🧪 开始测试套件...\n')

    const results = {
        passed: 0,
        failed: 0,
        total: TEST_CASES.length
    }

    for (const testCase of TEST_CASES) {
        console.log(`▶️  测试: ${testCase.name}`)

        try {
            const token = testCase.targetWord ? {
                word: testCase.targetWord,
                reading: '',
                romaji: '',
                pos: ''
            } : undefined

            await aiStore.generateCard(testCase.sentence, token)

            if (aiStore.cardError) {
                console.log(`   ❌ 失败: ${aiStore.cardError}`)
                results.failed++
            } else if (aiStore.cardData) {
                const validation = validateFlashcardData(
                    aiStore.cardData,
                    testCase.validationRules
                )

                if (validation.valid) {
                    console.log(`   ✅ 通过`)
                    results.passed++
                } else {
                    console.log(`   ❌ 验证失败:`)
                    validation.errors.forEach(err => console.log(`      - ${err}`))
                    results.failed++
                }
            }
        } catch (error) {
            console.log(`   ❌ 异常: ${error}`)
            results.failed++
        }

        console.log('')

        // Wait a bit to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000))
    }

    console.log(`\n📊 测试结果: ${results.passed}/${results.total} 通过`)
    return results
}
