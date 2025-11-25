<template>
    <div class="simple-editor">
        <!-- Google-like Header -->
        <header class="app-header">
            <div class="header-left">
                <span class="app-logo">🛡️</span>
                <span class="app-title">N2SF Intelligent Audit</span>
            </div>
            <div class="header-right">
                <!-- Add any global actions here if needed -->
            </div>
        </header>

        <!-- Main Content -->
        <main class="editor-container">
            <div v-if="loading" class="loading-state">
                Loading Editor...
            </div>
            <div v-else class="graph-wrapper">
                <td-graph />
            </div>
        </main>
    </div>
</template>

<script>
import TdGraph from '@/components/Graph.vue';
import tmActions from '@/store/actions/threatmodel.js';
import { mapState } from 'vuex';

export default {
    name: 'SimpleEditor',
    components: {
        TdGraph
    },
    data() {
        return {
            loading: true
        };
    },
    computed: mapState({
        model: (state) => state.threatmodel.data
    }),
    async mounted() {
        await this.initializeEditor();
    },
    methods: {
        async initializeEditor() {
            // 1. Check if model exists, if not create a default one
            if (!this.model || !this.model.summary) {
                const defaultModel = {
                    summary: {
                        title: 'New Architecture',
                        owner: 'User',
                        description: 'Network Architecture Diagram'
                    },
                    detail: {
                        contributors: [],
                        diagrams: [],
                        diagramTop: 0,
                        threatTop: 0
                    }
                };
                this.$store.commit('THREATMODEL_FETCH', defaultModel);
            }

            // 2. Check if diagram exists, if not create one
            if (!this.model.detail.diagrams || this.model.detail.diagrams.length === 0) {
                const newDiagram = {
                    id: 0,
                    title: 'Main Diagram',
                    diagramType: 'STRIDE', // Default type
                    cells: [],
                    version: '2.0'
                };
                this.model.detail.diagrams.push(newDiagram);
                this.$store.dispatch(tmActions.update, { diagramTop: 1 });
            }

            // 3. Select the first diagram
            const diagram = this.model.detail.diagrams[0];
            this.$store.dispatch(tmActions.diagramSelected, diagram);

            this.loading = false;
        }
    }
};
</script>

<style scoped>
.simple-editor {
    display: flex;
    flex-direction: column;
    height: 100vh;
    background-color: #f8f9fa; /* Google grey background */
    font-family: 'Roboto', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.app-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 24px;
    height: 64px;
    background-color: #ffffff;
    box-shadow: 0 1px 2px 0 rgba(60, 64, 67, 0.3), 0 1px 3px 1px rgba(60, 64, 67, 0.15);
    z-index: 100;
}

.header-left {
    display: flex;
    align-items: center;
    gap: 12px;
}

.app-logo {
    font-size: 24px;
}

.app-title {
    font-size: 22px;
    color: #5f6368;
    font-weight: 400;
}

.editor-container {
    flex: 1;
    display: flex;
    overflow: hidden;
    padding: 0; /* Full width */
}

.loading-state {
    margin: auto;
    font-size: 18px;
    color: #5f6368;
}

.graph-wrapper {
    width: 100%;
    height: 100%;
    background-color: #ffffff;
}
</style>
