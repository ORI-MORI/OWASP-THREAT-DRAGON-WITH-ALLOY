<template>
    <div class="graph-root">
        <!-- Top Area: Sidebar + Canvas -->
        <div class="top-area">
            <!-- Palette / Stencil Sidebar -->
            <div class="stencil-sidebar">
                <div class="stencil-header">Elements</div>
                <div ref="stencil_container" class="stencil-content"></div>
            </div>

            <!-- Main Canvas Area -->
            <div class="canvas-area">
                <div class="canvas-toolbar">
                    <div class="diagram-title">{{ diagram.title }}</div>
                    <div class="toolbar-buttons">
                        <td-graph-buttons :graph="graph" @saved="saved" @closed="closed" @verify="verify" />
                    </div>
                </div>
                
                <div id="graph-container" ref="graph_container" class="x6-graph-container"></div>
            </div>
        </div>

        <!-- Bottom Area: Properties -->
        <div class="bottom-area">
            <div class="properties-header">Properties</div>
            <div class="properties-content">
                <td-graph-properties />
            </div>
        </div>

        <div>
            <td-keyboard-shortcuts />
            <td-threat-edit-dialog ref="threatEditDialog" />
            <td-threat-suggest-dialog ref="threatSuggestDialog" />
        </div>
    </div>
</template>

<style lang="scss" scoped>
.graph-root {
    display: flex;
    flex-direction: column;
    height: 100%;
    width: 100%;
    overflow: hidden;
}

.top-area {
    display: flex;
    flex: 1; /* Takes up remaining space, but we'll limit it */
    height: 70%; /* Approximate split */
    min-height: 400px;
    border-bottom: 1px solid #e0e0e0;
}

.stencil-sidebar {
    width: 240px;
    background-color: #ffffff;
    border-right: 1px solid #e0e0e0;
    display: flex;
    flex-direction: column;
    z-index: 10;
}

.stencil-header {
    padding: 16px;
    font-size: 14px;
    font-weight: 500;
    color: #5f6368;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    border-bottom: 1px solid #f1f3f4;
}

.stencil-content {
    flex: 1;
    overflow-y: auto;
    padding: 8px;
}

.canvas-area {
    flex: 1;
    display: flex;
    flex-direction: column;
    background-color: #f8f9fa;
    position: relative;
    overflow: hidden; /* Ensure graph stays within bounds */
}

.canvas-toolbar {
    height: 56px;
    background-color: #ffffff;
    border-bottom: 1px solid #e0e0e0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 24px;
    flex-shrink: 0;
}

.diagram-title {
    font-size: 18px;
    color: #202124;
}

.x6-graph-container {
    flex: 1;
    width: 100%;
    height: 100%;
    outline: none;
}

.bottom-area {
    height: 30%;
    min-height: 200px;
    background-color: #ffffff;
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

.properties-header {
    padding: 12px 24px;
    font-size: 14px;
    font-weight: 500;
    color: #5f6368;
    background-color: #f1f3f4;
    border-bottom: 1px solid #e0e0e0;
}

.properties-content {
    flex: 1;
    overflow-y: auto;
    padding: 24px;
}
</style>

<script>
import { mapState } from 'vuex';

import TdGraphButtons from '@/components/GraphButtons.vue';
import TdGraphProperties from '@/components/GraphProperties.vue';
import TdKeyboardShortcuts from '@/components/KeyboardShortcuts.vue';
import TdThreatEditDialog from '@/components/ThreatEditDialog.vue';
import TdThreatSuggestDialog from './ThreatSuggestDialog.vue';

import { getProviderType } from '@/service/provider/providers.js';
import diagramService from '@/service/diagram/diagram.js';
import alloyService from '@/service/alloy.js';
import stencil from '@/service/x6/stencil.js';
import tmActions from '@/store/actions/threatmodel.js';

export default {
    name: 'TdGraph',
    components: {
        TdGraphButtons,
        TdGraphProperties,
        TdKeyboardShortcuts,
        TdThreatEditDialog,
        TdThreatSuggestDialog
    },
    computed: mapState({
        diagram: (state) => state.threatmodel.selectedDiagram,
        providerType: (state) => getProviderType(state.provider.selected)
    }),
    data() {
        return {
            graph: null
        };
    },
    async mounted() {
        this.init();
    },
    methods: {
        init() {
            this.graph = diagramService.edit(this.$refs.graph_container, this.diagram);
            stencil.get(this.graph, this.$refs.stencil_container);
            this.$store.dispatch(tmActions.notModified);
            this.graph.getPlugin('history').on('change', () => {
                const updated = Object.assign({}, this.diagram);
                updated.cells = this.graph.toJSON().cells;
                this.$store.dispatch(tmActions.diagramModified, updated);
            });
        },
        threatSelected(threatId,state) {
            this.$refs.threatEditDialog.editThreat(threatId,state);
        },
        threatSuggest(type){
            this.$refs.threatSuggestDialog.showModal(type);
        },
        saved() {
            console.debug('Save diagram');
            const updated = Object.assign({}, this.diagram);
            updated.cells = this.graph.toJSON().cells;
            this.$store.dispatch(tmActions.diagramSaved, updated);
            this.$store.dispatch(tmActions.saveModel);
        },
        async verify() {
            console.debug('Verify diagram with Alloy');
            try {
                const diagramData = this.graph.toJSON();
                const result = await alloyService.analyze(diagramData);
                
                if (result.success) {
                    if (result.result.includes('Counterexample found')) {
                        this.$bvToast.toast('Counterexample found! Check console for details.', {
                            title: 'Alloy Verification',
                            variant: 'danger',
                            solid: true
                        });
                    } else {
                        this.$bvToast.toast('No counterexample found. Model is valid.', {
                            title: 'Alloy Verification',
                            variant: 'success',
                            solid: true
                        });
                    }
                    console.log('Alloy Result:', result.result);
                } else {
                    this.$bvToast.toast('Verification failed: ' + result.error, {
                        title: 'Error',
                        variant: 'danger',
                        solid: true
                    });
                }
            } catch (error) {
                this.$bvToast.toast('Verification error: ' + error.message, {
                    title: 'Error',
                    variant: 'danger',
                    solid: true
                });
            }
        },
        async closed() {
            if (!this.$store.getters.modelChanged || await this.getConfirmModal()) {
                await this.$store.dispatch(tmActions.diagramClosed);
                this.$router.push({ name: `${this.providerType}ThreatModel`, params: this.$route.params });
            }
        },
        getConfirmModal() {
            return this.$bvModal.msgBoxConfirm(this.$t('forms.discardMessage'), {
                title: this.$t('forms.discardTitle'),
                okVariant: 'danger',
                okTitle: this.$t('forms.ok'),
                cancelTitle: this.$t('forms.cancel'),
                hideHeaderClose: true,
                centered: true
            });
        }
    },
    destroyed() {
        diagramService.dispose(this.graph);
    }
};
</script>