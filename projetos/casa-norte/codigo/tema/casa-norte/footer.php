</main>
<footer class="site-footer">
	<div class="wrap footer-grid">
		<div>
			<p class="footer-brand">Casa Norte<small>imóveis</small></p>
			<p class="muted"><?php echo esc_html( cn_opt( 'address' ) ); ?></p>
		</div>
		<nav aria-label="Rodapé">
			<?php wp_nav_menu( array( 'theme_location' => 'footer', 'container' => false, 'fallback_cb' => 'cn_fallback_menu', 'depth' => 1 ) ); ?>
		</nav>
		<div>
			<?php if ( is_active_sidebar( 'footer-notice' ) ) : dynamic_sidebar( 'footer-notice' ); else : ?>
				<p class="muted">Atendimento: <?php echo esc_html( cn_opt( 'hours' ) ); ?><br><?php echo esc_html( cn_opt( 'creci' ) ); ?></p>
			<?php endif; ?>
		</div>
	</div>
	<div class="wrap legal">
		<span>© <?php echo esc_html( gmdate( 'Y' ) ); ?> Casa Norte Imóveis</span>
		<span>Negócio fictício · projeto de portfólio, tema WordPress próprio</span>
	</div>
</footer>
<?php wp_footer(); ?>
</body>
</html>
